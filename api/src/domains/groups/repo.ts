import { Knex } from "knex";
import validate from "@app/shared/validate";
import * as Env from "@app/shared/env";

import type { Schema } from "@app/shared/validate";

class GroupWithSlugAlreadyExists extends Error {
  statusCode = 400;

  constructor(slug: string) {
    super();

    this.message = `The slug "${slug}" is already in use. Please modify your request before trying again.`;
  }
}

const isGroupUniqueSlugError = (err: Error) =>
  err.message.includes(
    'duplicate key value violates unique constraint "groups_slug_key"'
  );

const isTryingToAddUserTwiceToGroupError = (err: Error) =>
  err.message.includes(
    'duplicate key value violates unique constraint "user_groups_group_id_user_id_key"'
  );

const creationSchema: Schema = {
  id: "$GroupsCreation",
  type: "object",
  properties: {
    name: {
      type: "string",
      required: true,
      description:
        "A human-readable name for the group. Not unique across the system.",
    },
    slug: {
      type: "string",
      required: true,
      description:
        "The URL Slug to use for this group. Unique across the system",
    },
    description: {
      type: "string",
      required: false,
      description: "A markdown description of the specific group.",
    },
  },
};

export interface Group {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

class GroupsRepo {
  #connection: Knex;

  schemas = {
    create: creationSchema,
  };

  constructor(conn: Knex) {
    this.#connection = conn;
  }

  async create(input: Pick<Group, "name" | "slug" | "description">) {
    try {
      validate(input, this.schemas.create);

      const [row] = await this.#connection
        .into("groups")
        .insert(input)
        .returning("*");

      return row;
    } catch (e: any) {
      const err = e as Error;

      if (isGroupUniqueSlugError(err)) {
        throw new GroupWithSlugAlreadyExists(input.slug);
      }

      throw err;
    }
  }

  getById(groupId: string) {
    return this.#connection
      .from("groups")
      .where({ id: groupId })
      .select("*")
      .first();
  }

  getBySlug(slug: string) {
    return this.#connection.from("groups").where({ slug }).select("*").first();
  }

  getUsersForGroup(groupId: string) {
    return this.#connection
      .from("user_groups")
      .where({
        group_id: groupId,
      })
      .join("users", "users.id", "user_groups.user_id")
      .select("users.id", "users.email");
  }

  getHelpItemsForGroup(groupId: string) {
    return this.#connection
      .from("help_items")
      .where({
        group_id: groupId,
      })
      .select("*");
  }

  async assignUserToGroup(groupId: string, userId: string) {
    try {
      await this.#connection
        .into("user_groups")
        .insert({ group_id: groupId, user_id: userId });
    } catch (e: any) {
      const err = e as Error;

      if (isTryingToAddUserTwiceToGroupError(err)) {
        // it's okay, we got you fam. pretend it never happened
        return;
      }

      throw err;
    }
  }

  async removeUserFromGroup(groupId: string, userId: string) {
    await this.#connection
      .from("user_groups")
      .where({
        group_id: groupId,
        user_id: userId,
      })
      .delete();
  }

  async deleteById(id: string) {
    await this.#connection.from("groups").where({ id }).delete();
  }
}

export default GroupsRepo;
