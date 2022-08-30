import Koa from "koa";
import logger from "koa-pino-logger";
import Log from "@app/shared/log";

import Router from "./router";
import * as Middleware from "./middleware";

const server = new Koa();

server
  .use(Middleware.handleTopLevelState)
  .use(Middleware.handleStateErrors)
  .use(Middleware.handelValidationErrors)
  .use(Middleware.authenticateByHeader)
  .use(Middleware.canUserPefromAction)
  .use(
    logger({
      logger: Log.child({}),
      autoLogging: {
        ignorePaths: ["/__internal__/healthcheck"],
      },
    })
  )
  .use(Router.routes())
  .use(Router.allowedMethods());

export default server;
