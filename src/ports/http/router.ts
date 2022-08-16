import Router from "@koa/router";
import userRouter from "./routes/users";
import groupRouter from "./routes/groups";
import helpItemRouter from "./routes/helpItems";

const router = new Router();

router
  .use("/users", userRouter.routes(), userRouter.allowedMethods())
  .use("/groups", groupRouter.routes(), groupRouter.allowedMethods())
  .use("/help-items", helpItemRouter.routes(), helpItemRouter.allowedMethods());

export default router;
