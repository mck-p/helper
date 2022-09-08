import Router from "@koa/router";
import BodyParser from "koa-body";
import DB from "@app/ports/database";
import * as Middleware from "@app/ports/http/middleware";

import HelpItemRepo from "@app/domains/helpItems/repo";

const helpItemsRouter = new Router().use(BodyParser());
const helpItemRepo = new HelpItemRepo(DB);

helpItemsRouter
  .post(
    "/",
    Middleware.mustBeAuthenticated,
    Middleware.ensureUserCanPerformAction((ctx) => ({
      object: `HELP_ITEM`,
      action: "CREATE",
    })),
    async (ctx) => {
      const data = await helpItemRepo.create(ctx.request.body);

      ctx.state.data = data;
      ctx.state.statusCode = 201;
      ctx.state.meta = {
        uri: `/help-items/${data.id}`,
      };
    }
  )
  .get("/:id", async (ctx) => {
    const data = await helpItemRepo.getById(ctx.params.id);

    ctx.state.data = data;
  })
  .get("/:id/helpers", async (ctx) => {
    const data = await helpItemRepo.getHelpersForItem(ctx.params.id);

    ctx.state.data = data;
  })
  .post(
    "/:id/done",
    Middleware.mustBeAuthenticated,
    Middleware.ensureUserCanPerformAction((ctx) => ({
      object: `HELP_ITEM::${ctx.params.id}`,
      action: "COMPLETE",
    })),
    async (ctx) => {
      const data = await helpItemRepo.updateById(ctx.params.id, {
        done: true,
      });

      ctx.state.data = data;

      ctx.state.statusCode = 201;
    }
  )
  .post(
    "/:id/add-helper/:user_id",
    Middleware.mustBeAuthenticated,
    Middleware.ensureUserCanPerformAction((ctx) => ({
      object: `HELP_ITEM::${ctx.params.id}`,
      action: "ADD_HELPER",
    })),
    async (ctx) => {
      await helpItemRepo.addHelperToItem(ctx.params.id, ctx.params.user_id);

      ctx.state.data = {
        added: true,
      };

      ctx.state.statusCode = 201;
    }
  )
  .post(
    "/:id/remove-helper/:user_id",
    Middleware.mustBeAuthenticated,
    Middleware.ensureUserCanPerformAction((ctx) => ({
      object: `HELP_ITEM::${ctx.params.id}`,
      action: "REMOVE_HELPER",
    })),
    async (ctx) => {
      await helpItemRepo.removeHelperFromItem(
        ctx.params.id,
        ctx.params.user_id
      );

      ctx.state.data = {
        removed: true,
      };

      ctx.state.statusCode = 201;
    }
  )
  .delete(
    "/:id",
    Middleware.mustBeAuthenticated,
    Middleware.ensureUserCanPerformAction((ctx) => ({
      object: `HELP_ITEM::${ctx.params.id}`,
      action: "DELETE",
    })),
    async (ctx) => {
      await helpItemRepo.deleteById(ctx.params.id);

      ctx.state.data = {
        deleted: true,
      };
    }
  )
  .patch(
    "/:id",
    Middleware.mustBeAuthenticated,
    Middleware.ensureUserCanPerformAction((ctx) => ({
      object: `HELP_ITEM::${ctx.params.id}`,
      action: "UPDATE_ITEM",
    })),
    async (ctx) => {
      const data = await helpItemRepo.updateById(
        ctx.params.id,
        ctx.request.body
      );

      ctx.state.data = data;

      ctx.state.statusCode = 201;
      ctx.state.meta = {
        uri: `/help-items/${data.id}`,
      };
    }
  );
export default helpItemsRouter;
