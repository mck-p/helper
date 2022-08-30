import Router from "@koa/router";
import Log from "@app/shared/log";

const log = Log.child({
  name: "Internal Router",
});

const internalRouter = new Router();

internalRouter.get("/healthcheck", async (ctx) => {
  ctx.state.data = {
    healthy: true,
  };
});

export default internalRouter;
