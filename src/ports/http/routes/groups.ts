import Router from "@koa/router";
import BodyParser from "koa-body";
import DB from "@app/ports/database";
import GroupRepo from "@app/domains/groups/repo";

import * as Errors from "@app/ports/http/errors";

const groupRouter = new Router().use(BodyParser());

const groupRepo = new GroupRepo(DB);

groupRouter
  .post("/", async (ctx) => {
    const data = await groupRepo.create(ctx.request.body);

    ctx.state.data = data;
    ctx.state.statusCode = 201;
    ctx.state.meta = {
      uri: `/groups/${data.id}`,
    };
  })
  .get("/:id", async (ctx) => {
    const data = await groupRepo.getById(ctx.params.id);

    if (!data) {
      throw new Errors.ResourceNotFound("Group", ctx.params.id);
    }

    ctx.state.data = data;
  })
  .get("/:id/members", async (ctx) => {
    const data = await groupRepo.getUsersForGroup(ctx.params.id);

    ctx.state.data = data;
  })
  .post("/:id/add-member/:userId", async (ctx) => {
    await groupRepo.assignUserToGroup(ctx.params.id, ctx.params.userId);

    ctx.state.data = {
      added: true,
    };
  })
  .post("/:id/remove-member/:userId", async (ctx) => {
    await groupRepo.removeUserFromGroup(ctx.params.id, ctx.params.userId);

    ctx.state.data = {
      removed: true,
    };
  });

export default groupRouter;
