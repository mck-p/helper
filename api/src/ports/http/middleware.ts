import type { Context, Middleware } from "koa";
import { verify } from "jsonwebtoken";
import DB from "@app/ports/database";
import UserRepo from "@app/domains/users/repo";
import * as Env from "@app/shared/env";
import Log from "@app/shared/log";
import * as Authorization from "./authorization";
import * as Errors from "./errors";

const userRepo = new UserRepo(DB);

export const handleTopLevelState: Middleware = async (ctx, next) => {
  await next();

  if (ctx.state.error) {
    ctx.body = {
      error: ctx.state.error,
      meta: {
        statusCode: ctx.state.statusCode,
        ...ctx.state.meta,
      },
    };

    ctx.status = ctx.state.statusCode || 500;
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
};

export const handleStateErrors: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (e: any) {
    Log.warn({ err: e });
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

      const err = new TypeError(msg.trim()) as Error & {
        statusCode?: number;
      };
      err.statusCode = 400;

      throw err;
    }

    throw e;
  }
};

export const canUserPeformAction: Middleware = (ctx, next) => {
  ctx.canUserPeformAction = Authorization.canUserPeformAction;

  return next();
};

export const ensureUserCanPerformAction =
  (actionCreator: (ctx: Context) => { [x: string]: string }): Middleware =>
  (ctx, next) => {
    if (
      ctx.canUserPeformAction({
        ...actionCreator(ctx),
        user: ctx.user.id,
      })
    ) {
      return next();
    } else {
      throw new Errors.NotAuthorized();
    }
  };

export const authenticateByHeader: Middleware = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next();
    }

    try {
      const { data } = (await verify(token, Env.jwtSecret)) as any;

      const { id } = data;

      const user = await userRepo.getById(id);

      ctx.user = user || {};
    } catch (e) {
      ctx.user = {};
    }

    return next();
  } catch (e) {
    return next();
  }
};

export const mustBeAuthenticated: Middleware = (ctx, next) => {
  if (!ctx.user) {
    throw new Errors.NotAuthorized();
  } else {
    return next();
  }
};
