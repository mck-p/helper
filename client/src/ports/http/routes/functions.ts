import { URL } from "url";
import { randomUUID } from "crypto";
import Router from "@koa/router";
import Body from "koa-body";
import { AxiosError } from "axios";
import multer from "@koa/multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import mimetypes from "mime-types";

import * as Env from "@app/shared/env";
import Log from "@app/shared/log";
import * as API from "@app/ports/api";
import * as Middleware from "@app/ports/http/middleware";
import { Context } from "koa";

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: Env.spaces.space_key,
    secretAccessKey: Env.spaces.space_secret,
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: "starfleet-libary",
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        mimetype: file.mimetype,
      });
    },
    key: function (req, file, cb) {
      cb(
        null,
        `${randomUUID({ disableEntropyCache: true })}.${mimetypes.extension(
          file.mimetype
        )}`
      );
    },
  }) as any,
});

const functions = new Router();

class MustHaveSponsor extends Error {
  statusCode = 400;
  constructor(email?: string) {
    super();

    this.message = `You must have a sponsor to sign up.${
      email
        ? ` The email "${email}" does not exist in our records and cannot be used as a sponsor.`
        : ""
    }`;
  }
}

class EmailDoesNotExists extends Error {
  statusCode = 400;
  constructor(email: string) {
    super();

    this.message = `The email "${email}" does not exist in our records. Please sign up to the system before signing up for a group.`;
  }
}

const deletePreviousImage = async (key: string) => {
  const bucketParams = { Bucket: "starfleet-libary", Key: key };

  try {
    await s3.send(new DeleteObjectCommand(bucketParams));
  } catch (err) {
    Log.warn({ err }, "We tried to delete an image but failed. Swallowing");
  }
};

const deletePreviousSpaceImage = (imageLocation: string) => {
  const url = imageLocation.split("/");
  const key = url.pop();

  return deletePreviousImage(key!);
};

const getAuthenticationToken = (ctx: Context) =>
  ctx.cookies.get("authentication") || "";

functions
  .post("/group-sign-up", Body(), async (ctx) => {
    const { body } = ctx.request;

    if (!body.sponsor) {
      throw new MustHaveSponsor();
    }

    const sponsor = await API.users.getByEmail(body.sponsor);

    if (!sponsor) {
      throw new MustHaveSponsor(body.sponsor);
    }

    const user = await API.users.getByEmail(body.email);

    if (!user) {
      throw new EmailDoesNotExists(body.email);
    }

    await API.groups.requestAccess({
      groupId: body.groupId,
      userId: user.id,
      sponsorId: sponsor.id,
    });

    await ctx.render("groups/sign-up-success");
  })
  .post("/user-sign-up", Body(), async (ctx) => {
    const { body } = ctx.request;
    try {
      await API.users.signup(body);

      ctx.cookies.set(
        "authentication",
        await API.users.authenticate(body).then(({ token }) => token),
        {
          httpOnly: true,
        }
      );

      await ctx.redirect("/dashboard");
    } catch (e) {
      const redirectURL = new URL("http://localhost");

      redirectURL.searchParams.append("email", body.email);
      redirectURL.searchParams.append("referral", body.referral_email);
      redirectURL.searchParams.append("name", body.name);

      if (e instanceof AxiosError) {
        redirectURL.searchParams.append("error-type", "email-in-use");

        redirectURL.searchParams.append(
          "error-message",
          e.response?.data.error.message
        );
      } else {
        redirectURL.searchParams.append("error-type", "unknown");

        redirectURL.searchParams.append(
          "error-message",
          "Something went wrong. Please try your request again later."
        );
      }

      await ctx.redirect(`/sign-up${redirectURL.search}`);
    }
  })
  .post("/email-request", Body(), async (ctx) => {
    const { body } = ctx.request;

    if (!body.email) {
      const err = new Error(
        "Must send email in order to request access."
      ) as Error & { statusCode: number };

      err.statusCode = 400;

      throw err;
    }

    await API.groups.requestDemo(body.email);

    await ctx.render("groups/request-demo-success");
  })
  .post("/login", Body(), async (ctx) => {
    ctx.cookies.set(
      "authentication",
      await API.users.authenticate(ctx.request.body).then(({ token }) => token),
      {
        httpOnly: true,
      }
    );

    await ctx.redirect("/dashboard");
  })
  .post(
    "/help-items",
    Middleware.mustBeAuthenticated,
    upload.single("image"),
    async (ctx) => {
      const result = await API.helpItems.create(
        {
          ...ctx.request.body,
          image: (ctx.request.file as any).location,
          user_id: ctx.user.id,
        },
        getAuthenticationToken(ctx)
      );

      const group = await API.groups.getById(
        ctx.request.body.group_id,
        getAuthenticationToken(ctx)
      );

      await ctx.redirect(`/${group.slug}/help-items/${result.id}`);
    }
  )
  .post("/offer-help", Middleware.mustBeAuthenticated, Body(), async (ctx) => {
    await API.helpItems.offerHelp(
      {
        help_item: ctx.request.body.help_item,
        user_id: ctx.user.id,
      },
      getAuthenticationToken(ctx)
    );

    const group = await API.groups.getById(
      ctx.request.body.group_id,
      getAuthenticationToken(ctx)
    );

    await ctx.redirect(
      `/${group.slug}/help-items/${ctx.request.body.help_item}`
    );
  })
  .post("/cancel-help", Middleware.mustBeAuthenticated, Body(), async (ctx) => {
    await API.helpItems.cancelHelp(
      {
        help_item: ctx.request.body.help_item,
        user_id: ctx.user.id,
      },
      getAuthenticationToken(ctx)
    );

    const group = await API.groups.getById(
      ctx.request.body.group_id,
      getAuthenticationToken(ctx)
    );

    await ctx.redirect(
      `/${group.slug}/help-items/${ctx.request.body.help_item}`
    );
  })
  .post(
    "/delete-help-item",
    Middleware.mustBeAuthenticated,
    Body(),
    async (ctx) => {
      const oldItem = await API.helpItems.getById(
        ctx.request.body.help_item,
        getAuthenticationToken(ctx)
      );

      if (!oldItem) {
        return await ctx.redirect(`/dashboard`);
      }

      if (oldItem.image) {
        deletePreviousSpaceImage(oldItem.image);
      }

      await API.helpItems.delete(oldItem.id, getAuthenticationToken(ctx));

      const group = await API.groups.getById(
        ctx.request.body.group_id,
        getAuthenticationToken(ctx)
      );

      await ctx.redirect(`/${group.slug}/dashboard`);
    }
  )
  .post(
    "/update-help-item",
    Middleware.mustBeAuthenticated,
    upload.single("image"),
    async (ctx) => {
      const oldItem = await API.helpItems.getById(
        ctx.request.body.help_item,
        getAuthenticationToken(ctx)
      );

      if (!oldItem) {
        return await ctx.redirect(`/dashboard`);
      }

      const update: any = {
        title: ctx.request.body.title,
        description: ctx.request.body.description,
        help_type: ctx.request.body.help_type,
      };

      if (ctx.request.body.end_at) {
        update.end_at = ctx.request.body.end_at;
      }

      if (ctx.request.file) {
        if (oldItem.image) {
          deletePreviousSpaceImage(oldItem.image);
        }

        update.image = (ctx.request.file as any).location;
      }

      await API.helpItems.update(
        ctx.request.body.help_item,
        update,
        getAuthenticationToken(ctx)
      );

      const group = await API.groups.getById(
        ctx.request.body.group_id,
        getAuthenticationToken(ctx)
      );

      await ctx.redirect(`/${group.slug}/help-items/${oldItem.id}`);
    }
  )
  .post(
    "/update-profile",
    Middleware.mustBeAuthenticated,
    upload.single("avatar"),
    async (ctx) => {
      const oldProfile = await API.users.getById(ctx.user.id);

      if (ctx.request.file) {
        if (oldProfile.meta.avatar) {
          deletePreviousSpaceImage(oldProfile.meta.avatar);
        }
      }

      await API.users.updateProfile(
        ctx.user.id,
        {
          ...ctx.request.body,
          avatar: (ctx.request?.file as any)?.location,
        },
        getAuthenticationToken(ctx)
      );

      await ctx.redirect(`/profile`);
    }
  )
  .post(
    "/update-group",
    Middleware.mustBeAuthenticated,
    upload.single("avatar"),
    async (ctx) => {
      const form = ctx.request.body;

      const group = await API.groups.getById(
        form.group_id,
        getAuthenticationToken(ctx)
      );

      if (ctx.request.file) {
        if (group.meta.avatar) {
          deletePreviousSpaceImage(group.meta.avatar);
        }
      }

      await API.groups.updateGroupInfo(
        group.id,
        {
          ...form,
          avatar: (ctx.request?.file as any)?.location,
        },
        getAuthenticationToken(ctx)
      );

      await ctx.redirect(`/${group.slug}/admin`);
    }
  )
  .post(
    "/end-help-item",
    Middleware.mustBeAuthenticated,
    Body(),
    async (ctx) => {
      const form = ctx.request.body;
      const authToken = getAuthenticationToken(ctx);

      await API.helpItems.update(form.help_item, { done: true }, authToken);

      const group = await API.groups.getById(form.group_id, authToken);

      await ctx.redirect(`/${group.slug}/dashboard`);
    }
  )
  .post(
    "/restart-help-item",
    Middleware.mustBeAuthenticated,
    Body(),
    async (ctx) => {
      const form = ctx.request.body;
      const authToken = getAuthenticationToken(ctx);

      await API.helpItems.update(form.help_item, { done: false }, authToken);

      const group = await API.groups.getById(form.group_id, authToken);

      await ctx.redirect(`/${group.slug}/help-items/${form.help_item}`);
    }
  );

export default functions;
