import Router from "@koa/router";
import userRouter from "./routes/users";
import groupRouter from "./routes/groups";

const router = new Router();

router
  .use("/users", userRouter.routes(), userRouter.allowedMethods())
  .use("/groups", groupRouter.routes(), groupRouter.allowedMethods());

export default router;
