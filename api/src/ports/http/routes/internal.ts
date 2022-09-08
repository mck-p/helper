import path from "path";
import fs from "fs/promises";
import Router from "@koa/router";
import BodyParser from "koa-body";
import DB from "@app/ports/database";
import Log from "@app/shared/log";
import * as Middleware from "@app/ports/http/middleware";

const log = Log.child({
  name: "Internal Router",
});

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

const migrations = [
  path.join(sqlDir, "tables.sql"),
  path.join(sqlDir, "permissions.sql"),
  path.join(sqlDir, "group-roles.sql"),
  path.join(sqlDir, "group-meta.sql"),
  path.join(sqlDir, "finish-help-item.sql"),
];

const internalRouter = new Router().use(BodyParser());

internalRouter
  .get("/healthcheck", async (ctx) => {
    try {
      await DB.raw("SELECT NOW()");

      ctx.state.data = {
        healthy: true,
      };
    } catch (e) {
      log.warn({ err: e }, "Healthcheck Failed due to Database");

      ctx.status = 500;

      ctx.state.error = {
        healthy: false,
      };
    }
  })
  .post(
    "/db/migrate",
    Middleware.mustBeAuthenticated,
    Middleware.ensureUserCanPerformAction((ctx) => ({
      object: "DATABASE",
      action: "MIGRATE",
    })),
    async (ctx) => {
      for (const migration of migrations) {
        try {
          await DB.raw(await fs.readFile(migration, "utf-8"));
        } catch (err) {
          console.error(err);
          console.warn(
            "ERROR WHILE RUNNING MIGRATION. SWALLOWING BUT MAY CAUSE WEIRD RESULTS"
          );
        }
      }

      ctx.status = 201;
      ctx.state.data = {
        migration: true,
      };
    }
  );

export default internalRouter;
