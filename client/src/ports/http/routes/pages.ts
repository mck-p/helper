import Router from "@koa/router";
import * as API from "@app/ports/api";
import * as Middleware from "@app/ports/http/middleware";
import * as HelpItems from "@app/domains/help-items";

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

    const [helpItems, groups] = await Promise.all([
      API.users.getHelpItemsByUserId(ctx.user.id, `after=now&limit=10`),
      API.users.getGroupsByUserId(ctx.user.id),
    ]);

    await ctx.render("user/dashboard", {
      user: ctx.user,
      upcomingHelpItems: helpItems.map(HelpItems.clean),
      groups: {
        byId: groups.reduce(
          (a: any, c: any) => ({
            ...a,
            [c.id]: c,
          }),
          {}
        ),
        list: groups,
      },
    });
  })
  .get("/logout", (ctx) => {
    ctx.cookies.set("authentication", "");

    ctx.redirect("/login");
  })
  .get(
    "/:slug/help-items/create",
    Middleware.mustBeAuthenticated,
    async (ctx) => {
      const group = await API.groups.getBySlug(ctx.params.slug);

      if (!group) {
        // 404
        return;
      }

      ctx.addHeadScript(
        `<script src="https://cdn.tiny.cloud/1/mjunchb2kqoqhyr3wdq8i7o97g1chvkjxcuza3zk5qe774ri/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>`
      );

      ctx.addTailScript(`
      <script>
        tinymce.init({
          selector: 'textarea',
          plugins: 'advlist autolink lists link image charmap preview anchor pagebreak',
          toolbar_mode: 'floating',
        });
      </script>
    `);

      await ctx.render("help-item/create", { group });
    }
  )
  .get("/:slug/help-items/:id", Middleware.mustBeAuthenticated, async (ctx) => {
    const isInGroup = await API.users.userIsInGroup(
      ctx.user.id,
      ctx.params.slug
    );

    if (!isInGroup) {
      return ctx.redirect("/dashboard");
    }

    const helpItem = await API.helpItems.getById(ctx.params.id);

    if (!helpItem) {
      return ctx.redirect("/dashboard");
    }

    const helpers = await API.helpItems.getHelpersForHelpItem(ctx.params.id);

    await ctx.render("help-item/single", {
      helpItem: HelpItems.clean(helpItem),
      user: ctx.user,
      helpers,
    });
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
  .get("/:slug/dashboard", Middleware.mustBeAuthenticated, async (ctx) => {
    const group = await API.groups.getBySlug(ctx.params.slug);

    if (!group) {
      // 404
      return;
    }

    ctx.updateMeta({
      title: `${group.name} Dashboard`,
    });

    const helpItems = await API.helpItems.getHelpItemsForGroup(group.id);

    await ctx.render("groups/dashboard", { group, helpItems, user: ctx.user });
  })
  .get("/sign-up", async (ctx) => {
    ctx.updateMeta({
      title: "Sign Up",
    });

    await ctx.render("user/sign-up");
  });

export default pages;
