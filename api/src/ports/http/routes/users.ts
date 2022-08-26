import Router from "@koa/router";
import BodyParser from "koa-body";
import DB from "@app/ports/database";
import UserRepo from "@app/domains/users/repo";
import GroupRepo from "@app/domains/groups/repo";
import * as Errors from "@app/ports/http/errors";

const userRouter = new Router().use(BodyParser());

const userRepo = new UserRepo(DB);
const groupRepo = new GroupRepo(DB);

userRouter
  .get("/by-email/:email", async (ctx) => {
    const data = await userRepo.getByEmail(ctx.params.email);

    ctx.state.data = data;

    ctx.state.meta = {
      uri: `/users/${data.id}`,
    };
  })
  .post("/", async (ctx) => {
    const data = await userRepo.create(ctx.request.body);

    ctx.state.data = data;

    ctx.state.statusCode = 201;

    ctx.state.meta = {
      uri: `/users/${data.id}`,
    };
  })
  .post("/authenticate", async (ctx) => {
    const authenticated = await userRepo.passwordsMatch(ctx.request.body);

    if (!authenticated) {
      const error = new Error(
        "Bad password or email. Please change your input and try again."
      ) as Error & { statusCode: number };

      error.statusCode = 400;

      throw error;
    }

    const token = await userRepo.createTokenForUser(ctx.request.body);

    ctx.state.data = {
      token,
    };

    ctx.state.statusCode = 200;
  })
  .get("/:id", async (ctx) => {
    const data = await userRepo.getById(ctx.params.id);

    if (!data) {
      throw new Errors.ResourceNotFound("User", ctx.params.id);
    }

    ctx.state.data = data;
  })
  .get("/:id/in-group/:slug", async (ctx) => {
    const group = await groupRepo.getBySlug(ctx.params.slug);
    if (!group) {
      ctx.state.data = false;
      return;
    }

    ctx.state.data = await userRepo.isUserInGroup(ctx.params.id, group.id);
  })
  .patch("/:id", async (ctx) => {
    const data = await userRepo.update(ctx.params.id, ctx.request.body);

    ctx.state.data = data;
  })
  .patch("/:id/meta", async (ctx) => {
    const data = await userRepo.updateMeta(ctx.params.id, ctx.request.body);

    ctx.state.data = data;
  })
  .get("/:id/groups", async (ctx) => {
    const data = await userRepo.getGroupsForUser(ctx.params.id);

    ctx.state.data = data;
  })
  .get("/:id/help-items", async (ctx) => {
    const data = await userRepo.getHelpItemsForUser(ctx.params.id, ctx.query);

    ctx.state.data = data;
  })
  .get("/:id/help-requests", async (ctx) => {
    const data = await userRepo.getUserHelpRequests(ctx.params.id, ctx.query);

    ctx.state.data = data;
  });

export default userRouter;
