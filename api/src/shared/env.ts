import path from "path";
import getenv from "getenv";

export const log_level = getenv.string("LOG_LEVEL", "trace");
export const env = getenv.string("ENVIRONMENT", "development");
export const jwtSecret = getenv.string("JWT_SECRET", "my little secret");
export const port = getenv.int("PORT", 5000);

export const dev = env === "development";

export const dbConnection = {
  user: getenv.string("DB_USER", "username"),
  password: getenv.string("DB_PASSWORD", "password"),
  host: getenv.string("DB_HOST", "0.0.0.0"),
  port: getenv.int("DB_PORT", 9999),
  database: getenv.string("DB_NAME", "helper"),
};

export const cacheConnection = {
  port: getenv.int("CACHE_PORT", 9998),
  host: getenv.string("CACHE_HOST", "0.0.0.0"),
  password: getenv.string("CACHE_PASSWORD", "password"),
};
