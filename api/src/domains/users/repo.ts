import { Knex } from "knex";
import bcrypt from "bcrypt";
import validate from "@app/shared/validate";
import JSONWebToken from "jsonwebtoken";
import * as Env from "@app/shared/env";

import type { Schema } from "@app/shared/validate";

class UserAlreadyExists extends Error {
  statusCode = 400;

  constructor(email: string) {
    super();

    this.message = `The email "${email}" already has an account. Please change your query or try to log in instead.`;
  }
}

const isEmailUniqueKeyFailure = (err: Error) =>
  err.message.includes(`duplicate key value violates unique constraint`);

const creationSchema: Schema = {
  id: "$UserCreation",
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
      description:
        'The unique email for the person that will identify them across logins and as a "thing"',
      required: true,
    },
    password: {
      type: "string",
      required: true,
      description:
        "The plaintext password of the user. Will be hashed before saving",
      minLength: 6,
    },
    referral_email: {
      type: "string",
      format: "email",
      description: "The email of the person that referred this user to Helper",
    },
  },
};

const validatePasswordSchema: Schema = {
  id: "$UserValidation",
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
      description:
        'The unique email for the person that will identify them across logins and as a "thing"',
      required: true,
    },
    password: {
      type: "string",
      required: true,
      description:
        "The plaintext password of the user. Will be validated against the hashed version.",
      minLength: 6,
    },
  },
};

const updateSchema: Schema = {
  id: "$UserUpdate",
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
      description:
        'The unique email for the person that will identify them across logins and as a "thing"',
      required: true,
    },
    password: {
      type: "string",
      description:
        "The plaintext password of the user. Will be hashed before updating",
      minLength: 6,
    },
  },
};

interface User {
  id: string;
  email: string;
  password: string;
  referral_email?: string;
  meta: { [x: string]: any };
  created_at: Date;
  updated_at: Date;
}

class UserRepo {
  #connection: Knex;

  schemas = {
    create: creationSchema,
    update: updateSchema,
    validateEmail: validatePasswordSchema,
  };

  constructor(conn: Knex) {
    this.#connection = conn;
  }

  async create(input: Pick<User, "email" | "password">) {
    try {
      validate(input, this.schemas.create);

      const userInput = {
        ...input,
        password: await bcrypt.hash(input.password, 10),
      };

      const [user] = await this.#connection
        .into("users")
        .insert(userInput)
        .returning("*");

      delete user.password;

      return user;
    } catch (e: any) {
      const err = e as Error;

      if (isEmailUniqueKeyFailure(err)) {
        throw new UserAlreadyExists(input.email);
      }

      throw err;
    }
  }

  async update(id: string, input: Pick<User, "email" | "password">) {
    validate(input, this.schemas.update);

    const update = input;

    if (update.password) {
      update.password = await bcrypt.hash(input.email, 10);
    }

    const [user] = await this.#connection
      .from("users")
      .where({
        id,
      })
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .returning("*");

    delete user.password;

    return user;
  }

  async updateMeta(id: string, newMeta: { [x: string]: any }) {
    const { meta } = await this.#connection
      .from("users")
      .where({ id })
      .select(["id", "meta"])
      .first();

    const [updated] = await this.#connection
      .from("users")
      .where({ id })
      .update({
        meta: Object.assign({}, meta, newMeta),
      })
      .returning("*");

    delete updated.password;

    return updated;
  }

  async passwordsMatch(input: Pick<User, "email" | "password">) {
    validate(input, this.schemas.validateEmail);

    const user = await this.#connection
      .from("users")
      .where({
        email: input.email,
      })
      .select(["id", "password"])
      .first();

    if (!user) {
      return false;
    }

    return bcrypt.compare(input.password, user.password);
  }

  async getByEmail(email: string) {
    const user = await this.#connection
      .from("users")
      .where({ email })
      .select("*")
      .first();

    if (!user) {
      return;
    }

    delete user.password;

    return user;
  }

  async getById(userId: string) {
    const user = await this.#connection
      .from("users")
      .where({ id: userId })
      .select("*")
      .first();

    delete user.password;

    return user;
  }

  async createTokenForUser(input: Pick<User, "email">) {
    const token = await JSONWebToken.sign(
      {
        data: await this.getByEmail(input.email),
      },
      Env.jwtSecret,
      {
        issuer: "Overlord",
        expiresIn: "24hr",
      }
    );

    return token;
  }

  getGroupsForUser(userId: string) {
    return this.#connection
      .from("user_groups")
      .where({
        user_id: userId,
      })
      .join("groups", "groups.id", "user_groups.group_id")
      .select("groups.*");
  }

  getHelpItemsForUser(userId: string, query: { [x: string]: any }) {
    const args: { [x: string]: any } = {
      limit: query.limit ?? 10,
    };

    if (query.after) {
      if (query.after === "now") {
        args.after = new Date().toISOString();
      } else {
        args.after = query.after;
      }
    }

    if (query.done === "true") {
      args.done = true;
    } else {
      args.done = false;
    }

    return this.#connection
      .from("helpers")
      .where({ user_id: userId, done: args.done })
      .andWhere((builder) => {
        if (args.after) {
          builder.where("end_at", ">", args.after);
        }

        return builder.orWhereNull("end_at");
      })
      .join("help_items", "help_items.id", "helpers.help_item_id")
      .select("help_items.*")
      .limit(args.limit)
      .orderBy("help_items.created_at", "DESC");
  }

  getUserHelpRequests(userId: string, query: { [x: string]: any }) {
    const args: { [x: string]: any } = {
      limit: query.limit ?? 10,
    };

    if (query.after) {
      if (query.after === "now") {
        args.after = new Date().toISOString();
      } else {
        args.after = query.after;
      }
    }

    if (query.done === "true") {
      args.done = true;
    } else {
      args.done = false;
    }

    return this.#connection
      .from("help_items")
      .where({ creator_id: userId, done: args.done })
      .andWhere((builder) => {
        if (args.after) {
          builder.where("end_at", ">", args.after);
        }

        return builder.orWhereNull("end_at");
      })
      .select("*");
  }

  isUserInGroup(userId: string, groupId: string) {
    return this.#connection
      .from("user_groups")
      .where({
        user_id: userId,
        group_id: groupId,
      })
      .select("user_id")
      .then((data) => data.length > 0);
  }
}

export default UserRepo;
