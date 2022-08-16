import pages from "./routes/pages";
import functions from "./routes/functions";
import Router from "@koa/router";

const router = new Router();

router.use("/functions", functions.routes()).use(pages.routes());

export default router;
