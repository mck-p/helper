import Knex from "knex";
import * as Env from "@app/shared/env";

export default Knex({
  client: "postgresql",
  debug: Env.dev,
  connection: Env.dbConnection,
});
