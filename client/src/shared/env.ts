import getenv from "getenv";

export const port = getenv.int("PORT", 5001);
export const logLevel = getenv.string("LOG_LEVEL", "trace");

export const api = {
  urlBase: getenv.string("UPSTREAM_API_URL_BASE", "http://localhost:5000"),
};
