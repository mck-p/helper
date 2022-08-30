import pages from "./routes/pages";
import functions from "./routes/functions";
import internal from "./routes/internal";
import Router from "@koa/router";

const router = new Router();

router
  .use("/__internal__", internal.routes())
  .use("/functions", functions.routes())
  .use(pages.routes());

export default router;
