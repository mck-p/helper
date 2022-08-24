import Router from "@koa/router";
import { verify } from "jsonwebtoken";
import * as API from "@app/ports/api";
import * as Env from "@app/shared/env";
import * as Middleware from "@app/ports/http/middleware";

const pages = new Router();

pages
  .get("/", Middleware.renderPage("landing"))
  .get(
    "/privacy-policy",
    Middleware.renderPage("privacy-policy", { title: "Privacy Policy" })
  )
  .get("/sign-up", Middleware.renderPage("user/sign-up", { title: "Sign Up" }))
  .get("/login", Middleware.renderPage("user/login", { title: "Login" }))
  .get("/dashboard", Middleware.mustBeAuthenticated, async (ctx) => {
    ctx.updateMeta({
      title: "Dashboard",
    });

    await ctx.render("user/dashboard", { user: ctx.user });
  })
  .get("/logout", (ctx) => {
    ctx.cookies.set("authentication", "");
    ctx.redirect("/login");
  })
  .get("/:slug/sign-up", async (ctx) => {
    const group = await API.groups.getBySlug(ctx.params.slug);

    if (!group) {
      // 404
      return;
    }

    ctx.updateMeta({
      title: `${group.name} Sign-Up Request`,
    });

    await ctx.render("groups/sign-up", { group });
  })
  .get("/sign-up", async (ctx) => {
    ctx.updateMeta({
      title: "Sign Up",
    });

    await ctx.render("user/sign-up");
  });

export default pages;
