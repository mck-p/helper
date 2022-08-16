import Router from "@koa/router";
import Body from "koa-body";
import * as API from "@app/ports/api";

const functions = new Router().use(Body());

class MustHaveSponsor extends Error {
  statusCode = 400;
  constructor(email?: string) {
    super();

    this.message = `You must have a sponsor to sign up.${
      email
        ? ` The email "${email}" does not exist in our records and cannot be used as a sponsor.`
        : ""
    }`;
  }
}

class EmailDoesNotExists extends Error {
  statusCode = 400;
  constructor(email: string) {
    super();

    this.message = `The email "${email}" does not exist in our records. Please sign up to the system before signing up for a group.`;
  }
}

functions.post("/sign-up", async (ctx) => {
  console.log("hello?");
  const { body } = ctx.request;

  if (!body.sponsor) {
    throw new MustHaveSponsor();
  }

  const sponsor = await API.users.getByEmail(body.sponsor);

  if (!sponsor) {
    throw new MustHaveSponsor(body.sponsor);
  }

  const user = await API.users.getByEmail(body.email);

  if (!user) {
    throw new EmailDoesNotExists(body.email);
  }

  await API.groups.requestAccess({
    groupId: body.groupId,
    userId: user.id,
    sponsorId: sponsor.id,
  });

  await ctx.render("groups/sign-up-success");
});

export default functions;
