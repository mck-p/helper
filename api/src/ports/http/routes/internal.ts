import path from "path";
import fs from "fs/promises";
import Router from "@koa/router";
import BodyParser from "koa-body";
import DB from "@app/ports/database";
import GroupRepo from "@app/domains/groups/repo";

import * as Errors from "@app/ports/http/errors";

const sqlDir = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "artifacts",
  "database"
);

const migrations = [path.join(sqlDir, "tables.sql")];

const internalRouter = new Router().use(BodyParser());

internalRouter.post("/db/migrate", async (ctx) => {
  for (const migration of migrations) {
    await DB.raw(await fs.readFile(migration, "utf-8"));
  }

  ctx.status = 201;
  ctx.state.data = {
    migration: true,
  };
});

export default internalRouter;
