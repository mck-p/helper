import path from "path";

import Koa from "koa";
import logger from "koa-pino-logger";
import EJS from "koa-ejs";
import Static from "koa-static";

import Log from "@app/shared/log";

import Router from "./router";
import * as Middleware from "./middleware";

const server = new Koa();

const projectRoot = path.resolve(__dirname, "..", "..", "..");

EJS(server, {
  root: path.resolve(projectRoot, "views"),
  cache: false,
});

server
  .use(Middleware.handleTopLevelState)
  .use(Middleware.handleStateErrors)
  .use(Middleware.handelValidationErrors)
  .use(
    logger({
      logger: Log.child({}),
    })
  )
  .use(Static(path.relative(projectRoot, "public")))
  .use(Router.routes())
  .use(Router.allowedMethods());

export default server;
