import Pino from "pino";
import { log_level } from "@app/shared/env";

export default Pino({
  level: log_level,
  serializers: Pino.stdSerializers,
});
