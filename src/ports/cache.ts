import Redis from "redis";
import * as Env from "@app/shared/env";

export default Redis.createClient(Env.cacheConnection);
