import getenv from "getenv";

export const port = getenv.int("PORT", 5001);
export const logLevel = getenv.string("LOG_LEVEL", "trace");

export const jwtSecret = getenv.string("JWT_SECRET", "my little secret");

export const api = {
  urlBase: getenv.string("UPSTREAM_API_URL_BASE", "http://localhost:5000"),
};

export const spaces = {
  space_key: getenv.string("SPACE_KEY"),
  space_secret: getenv.string("SPACE_SECRET"),
};
