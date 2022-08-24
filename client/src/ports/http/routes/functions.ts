import { URL } from "url";

import Router from "@koa/router";
import Body from "koa-body";
import * as API from "@app/ports/api";
import { AxiosError } from "axios";

const functions = new Router().use(Body());

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

functions
  .post("/group-sign-up", async (ctx) => {
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
  .post("/user-sign-up", async (ctx) => {
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
  .post("/email-request", async (ctx) => {
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
  .post("/login", async (ctx) => {
    ctx.cookies.set(
      "authentication",
      await API.users.authenticate(ctx.request.body).then(({ token }) => token),
      {
        httpOnly: true,
      }
    );

    await ctx.redirect("/dashboard");
  });

export default functions;
