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
  .post("/request-demo", async (ctx) => {
    const data = await groupRepo.requestDemo(ctx.request.body.email);

    ctx.state.data = {
      requested: true,
    };
  })
  .get("/:id", async (ctx) => {
    const data = await groupRepo.getById(ctx.params.id);

    if (!data) {
      throw new Errors.ResourceNotFound("Group", ctx.params.id);
    }

    ctx.state.data = data;
  })
  .get("/:id/help-items", async (ctx) => {
    const data = await groupRepo.getHelpItemsForGroup(ctx.params.id);

    ctx.state.data = data;
  })
  .get("/:id/members", async (ctx) => {
    const data = await groupRepo.getUsersForGroup(ctx.params.id);

    ctx.state.data = data;
  })
  .get("/slug/:slug", async (ctx) => {
    const data = await groupRepo.getBySlug(ctx.params.slug);

    ctx.state.data = data;
  })
  .post("/:id/add-member/:userId", async (ctx) => {
    await groupRepo.assignUserToGroup(ctx.params.id, ctx.params.userId);

    ctx.state.data = {
      added: true,
    };
  })
  .post("/:id/request-access/:user_id/:sponsor_id", async (ctx) => {
    await groupRepo.requestUserJoinGroup({
      groupId: ctx.params.id,
      userId: ctx.params.user_id,
      sponsorId: ctx.params.sponsor_id,
    });

    ctx.state.data = {
      added: true,
    };
  })
  .post("/:id/remove-member/:userId", async (ctx) => {
    await groupRepo.removeUserFromGroup(ctx.params.id, ctx.params.userId);

    ctx.state.data = {
      removed: true,
    };
  })
  .delete("/:id", async (ctx) => {
    await groupRepo.deleteById(ctx.params.id);

    ctx.state.data = {
      deleted: true,
    };
  });

export default groupRouter;
