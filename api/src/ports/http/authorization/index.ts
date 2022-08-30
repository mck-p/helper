import DB from "@app/ports/database";
import { userInfo } from "os";

const parseAction = (actionStr: string, sep = "::") => {
  if (!actionStr) {
    throw new TypeError(`Gave parseAction an empty string.`);
  }

  const [action] = actionStr.split(sep);

  return { action };
};

const parseObject = (objectStr: string, sep = "::") => {
  if (!objectStr) {
    throw new TypeError(`Gave parseObject an empty string.`);
  }

  const [domain, id] = objectStr.split(sep) as [string, string?];

  return { domain, id };
};

export const canUserPefromAction = async (unparsed: {
  object: string;
  user: string;
  action: string;
}) => {
  const [object, action] = [
    parseObject(unparsed.object),
    parseAction(unparsed.action),
  ];

  const roles = await DB.from("user_roles")
    .where({ user_id: unparsed.user })
    .join("roles", "roles.id", "user_roles.role_id")
    .select("roles.*");

  if (roles.some(({ name }) => name === "site-admin")) {
    return true;
  }

  return false;
};
