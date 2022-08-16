import Pino from "pino";
import * as Env from "@app/shared/env";

export default Pino({
  name: "Helper [Client]",
  level: Env.logLevel,
  serializers: Pino.stdSerializers,
});
