import Router from "@koa/router";
import userRouter from "./routes/users";
import groupRouter from "./routes/groups";
import helpItemRouter from "./routes/helpItems";
import internalRouter from "./routes/internal";

const router = new Router();

router
  .use("/users", userRouter.routes(), userRouter.allowedMethods())
  .use("/groups", groupRouter.routes(), groupRouter.allowedMethods())
  .use("/help-items", helpItemRouter.routes(), helpItemRouter.allowedMethods());
// uncomment the below lines if you want to add the internal
// routes such as DB Admin and such
// only useful when you need to do _serious_ admin stuff
// .use(
//   "/__internal__",
//   internalRouter.routes(),
//   internalRouter.allowedMethods()
// );

export default router;
