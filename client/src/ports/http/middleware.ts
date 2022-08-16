import type { Middleware } from "koa";

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
