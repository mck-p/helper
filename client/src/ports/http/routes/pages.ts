import Router from "@koa/router";
import * as API from "@app/ports/api";

const pages = new Router();

pages
  .get("/:slug/sign-up", async (ctx) => {
    const group = await API.groups.getBySlug(ctx.params.slug);

    if (!group) {
      // 404
      return;
    }

    await ctx.render("groups/sign-up", { group });
  })
  .get("/", async (ctx) => {
    await ctx.render("landing");
  });

export default pages;
