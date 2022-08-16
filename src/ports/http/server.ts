import Koa from "koa";
import logger from "koa-pino-logger";
import Router from "./router";
import * as Middleware from "./middleware";

const server = new Koa();

server
  .use(Middleware.handleTopLevelState)
  .use(Middleware.handleStateErrors)
  .use(Middleware.handelValidationErrors)
  .use(logger())
  .use(Router.routes())
  .use(Router.allowedMethods());

export default server;
