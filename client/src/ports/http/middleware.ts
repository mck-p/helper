import type { Middleware } from "koa";
import { verify } from "jsonwebtoken";

import * as Errors from "./errors";
import * as API from "@app/ports/api";
import * as Env from "@app/shared/env";

export const handleTopLevelState: Middleware = async (ctx, next) => {
  await next();

  if (ctx.state.error) {
    ctx.status = ctx.state.statusCode || 500;
    await ctx.render("error", { error: ctx.state.error });
  }

  if (ctx.state.data) {
    ctx.body = {
      data: ctx.state.data,
      meta: {
        statusCode: ctx.state.statusCode || 200,
        ...ctx.state.meta,
      },
    };

    ctx.status = ctx.state.statusCode || 200;
  }

  // If no one added a body and did not tell
  // me via 204 status that they would not
  // treat as 404
  if (!ctx.body && ctx.status !== 204) {
    ctx.status = 404;
    await ctx.render("404");
  }
};

export const handleStateErrors: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (e: any) {
    ctx.state.error = {
      message: e.message,
    };

    ctx.state.statusCode = e.statusCode || 500;
  }
};

export const handelValidationErrors: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (e: any) {
    if (e.errors) {
      const msg = e.errors.reduce(
        (a: string, c: { property: string; message: string }) =>
          `${a}\n\n${c.property} ${c.message}`,
        ""
      );

      const err = new TypeError(msg.trim()) as Error & { statusCode?: number };
      err.statusCode = 400;

      throw err;
    }

    throw e;
  }
};

export const updateMeta: Middleware = (ctx, next) => {
  ctx.state.meta = {};

  ctx.updateMeta = (update: { [x: string]: any }) => {
    ctx.state.meta = Object.assign({}, ctx.state.meta, update);
  };

  return next();
};

export const addScripts: Middleware = (ctx, next) => {
  ctx.state.scripts = {
    head: new Set(),
    tail: new Set(),
  };

  ctx.addHeadScript = (scriptLocation: string) => {
    ctx.state.scripts.head.add(scriptLocation);
  };

  ctx.addTailScript = (scriptLocation: string) => {
    ctx.state.scripts.tail.add(scriptLocation);
  };

  return next();
};

export const addQueryToView: Middleware = (ctx, next) => {
  ctx.state.meta.query = ctx.query;

  return next();
};

export const authenticateByCookie: Middleware = async (ctx, next) => {
  try {
    const token = ctx.cookies.get("authentication");

    if (!token) {
      return next();
    }

    const { data } = (await verify(token, Env.jwtSecret)) as any;
    const { id } = data;

    const user = await API.users.getById(id);

    ctx.user = user;

    return next();
  } catch (e) {
    return next();
  }
};

export const mustBeAuthenticated: Middleware = (ctx, next) => {
  if (!ctx.user) {
    return ctx.redirect("/login");
  } else {
    return next();
  }
};

export const renderPage =
  (pageName: string, meta?: { [x: string]: any }): Middleware =>
  async (ctx) => {
    if (meta) {
      ctx.updateMeta(meta);
    }

    await ctx.render(pageName);
  };
