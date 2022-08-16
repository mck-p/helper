import Router from "@koa/router";
import BodyParser from "koa-body";
import DB from "@app/ports/database";
import UserRepo from "@app/domains/users/repo";
import * as Errors from "@app/ports/http/errors";

const userRouter = new Router().use(BodyParser());

const userRepo = new UserRepo(DB);

userRouter
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
  });

export default userRouter;
