import Router from "@koa/router";
import * as API from "@app/ports/api";
import * as Middleware from "@app/ports/http/middleware";
import * as HelpItems from "@app/domains/help-items";
import * as Authorization from "@app/ports/http/authorization";
import { Context } from "koa";

const pages = new Router();

const getAuthenticationToken = (ctx: Context) =>
  ctx.cookies.get("authentication") || "";

const groupPages = new Router();

groupPages
  .use(Middleware.mustBeAuthenticated)
  .param("slug", async (slug, ctx, next) => {
    const group = await API.groups.getBySlug(slug, getAuthenticationToken(ctx));

    if (!group) {
      return;
    }

    ctx.state.group = group;
    ctx.state.isAdmin = await API.groups.isUserAdmin(ctx.user.id, group.id);

    return next();
  })
  .get("/:slug/help-items/create", async (ctx) => {
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

    await ctx.render("help-item/create");
  })
  .get("/:slug/help-items/:id/edit", async (ctx) => {
    const helpItem = await API.helpItems.getById(
      ctx.params.id,
      getAuthenticationToken(ctx)
    );

    if (!helpItem) {
      return ctx.redirect(`/${ctx.state.group.slug}/dashboard`);
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

    await ctx.render("help-item/edit", {
      helpItem: HelpItems.clean(helpItem),
    });
  })
  .get("/:slug/help-items/:id", async (ctx) => {
    const isInGroup = await API.users.userIsInGroup(
      ctx.user.id,
      ctx.params.slug
    );

    if (!isInGroup) {
      return ctx.redirect("/dashboard");
    }

    const helpItem = await API.helpItems.getById(
      ctx.params.id,
      getAuthenticationToken(ctx)
    );

    if (!helpItem) {
      return ctx.redirect(`/${ctx.state.group.slug}/dashboard`);
    }

    const helpers = await API.helpItems.getHelpersForHelpItem(
      ctx.params.id,
      getAuthenticationToken(ctx)
    );

    await ctx.render("help-item/single", {
      helpItem: HelpItems.clean(helpItem),
      user: ctx.user,
      helpers,
    });
  })
  .get("/:slug/sign-up", async (ctx) => {
    ctx.updateMeta({
      title: `${ctx.state.group.name} Sign-Up Request`,
    });

    await ctx.render("groups/sign-up");
  })
  .get("/:slug/admin", async (ctx) => {
    const userIsAdmin = await Authorization.isUserAdmin(
      ctx.user.id,
      ctx.state.group.id
    );

    if (!userIsAdmin) {
      return ctx.redirect("/dashboard");
    }

    ctx.updateMeta({
      title: `${ctx.state.group.name} Admin Dashboard`,
    });

    await ctx.render("groups/admin/dashboard", {
      user: ctx.user,
    });
  })
  .get("/:slug/admin/edit", async (ctx) => {
    if (!ctx.state.isAdmin) {
      return ctx.redirect("/dashboard");
    }

    ctx.updateMeta({
      title: `Edit ${ctx.state.group.name}`,
    });

    ctx.addHeadScript(
      `<script src="https://cdn.tiny.cloud/1/mjunchb2kqoqhyr3wdq8i7o97g1chvkjxcuza3zk5qe774ri/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>`
    );

    ctx.addTailScript(`
      <script>
        tinymce.init({
          selector: '#description',
          plugins: 'advlist autolink lists link image charmap preview anchor pagebreak',
          toolbar_mode: 'floating',
        });
      </script>
    `);

    await ctx.render("groups/admin/edit-group", {
      user: ctx.user,
    });
  })
  .get("/:slug/dashboard", async (ctx) => {
    ctx.updateMeta({
      title: `${ctx.state.group.name} Dashboard`,
    });

    const helpItems = await API.helpItems.getHelpItemsForGroup(
      ctx.state.group.id,
      getAuthenticationToken(ctx)
    );

    const users = await API.users.usersInGroup(
      ctx.state.group.id,
      getAuthenticationToken(ctx)
    );

    const userIsAdmin = await Authorization.isUserAdmin(
      ctx.user.id,
      ctx.state.group.id
    );

    await ctx.render("groups/dashboard", {
      helpItems,
      user: ctx.user,
      users,
      isAdmin: userIsAdmin,
    });
  })
  .get("/:slug/members/:id", async (ctx) => {
    const user = await API.users.getById(ctx.params.id);

    await ctx.render("user/profile/single", { user });
  });

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

    const [helpItems, groups, helpRequests] = await Promise.all([
      API.users.getHelpItemsByUserId(ctx.user.id, `after=now&limit=10`),
      API.users.getGroupsByUserId(ctx.user.id),
      API.users.getHelpRequesrtsByUserId(ctx.user.id, `after=now&limit=10`),
    ]);

    await ctx.render("user/dashboard", {
      user: ctx.user,
      upcomingHelpItems: helpItems.map(HelpItems.clean),
      upcomingHelpRequests: helpRequests.map(HelpItems.clean),
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
  .get("/sign-up", async (ctx) => {
    ctx.updateMeta({
      title: "Sign Up",
    });

    await ctx.render("user/sign-up");
  })
  .get("/profile/edit", Middleware.mustBeAuthenticated, async (ctx) => {
    await ctx.render("user/profile/edit", { user: ctx.user });
  })
  .get("/profile", Middleware.mustBeAuthenticated, async (ctx) => {
    await ctx.render("user/profile/single", { user: ctx.user });
  })
  .use(groupPages.routes());

export default pages;
