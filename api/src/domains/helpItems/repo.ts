import { Knex } from "knex";
import validate from "@app/shared/validate";

import type { Schema } from "@app/shared/validate";

const isHelperItemUserUniqueError = (err: Error) =>
  err.message.includes(
    'duplicate key value violates unique constraint "helpers_user_id_help_item_id_key"'
  );

export enum HelpType {
  FINANCIAL = "financial",
  TIME = "time",
  GENERAL = "general",
}

const creationSchema: Schema = {
  id: "$HelpItem",
  type: "object",
  properties: {
    title: {
      type: "string",
      required: true,
      description: "The human-readble Title for this help item.",
    },
    description: {
      type: "string",
      required: false,
      description: "Markdown description of the help that is needed.",
    },
    help_type: {
      type: "string",
      enum: ["financial", "time", "general"],
      required: false,
      description:
        "The type of help that is required. Will default to general if not given.",
    },
    group_id: {
      type: "string",
      required: true,
      description: "The UUID of the Group that this Help Item belongs to.",
    },
    end_at: {
      type: "string",
      format: "timestamp",
      required: false,
      description: "If this Help Item has an End Date, it will be an ISO Date",
    },
    meta: {
      type: "object",
      required: false,
      description:
        "Random Key/Values pairings that may hold more data depending on the request",
    },
    image: {
      type: "string",
      format: "url",
      description: "The URL for the image to use as the headliner",
    },
  },
};

export interface HelpItem {
  id: string;
  title: string;
  description?: string;
  created_at: Date;
  end_at: Date;
  help_type: HelpType;
  meta: {
    [x: string]: any;
  };
  image?: string;
  group_id: string;
}

class HelpItemRepo {
  #connection: Knex;

  schemas = {
    create: creationSchema,
  };

  constructor(conn: Knex) {
    this.#connection = conn;
  }

  async create(
    input: Pick<
      HelpItem,
      | "title"
      | "description"
      | "end_at"
      | "help_type"
      | "meta"
      | "group_id"
      | "image"
    >
  ) {
    validate(input, this.schemas.create);

    const [row] = await this.#connection
      .into("help_items")
      .insert(input)
      .returning("*");

    return row;
  }

  getById(helpItemId: string) {
    return this.#connection
      .from("help_items")
      .where({
        id: helpItemId,
      })
      .select("*")
      .first();
  }

  async addHelperToItem(itemId: string, helperId: string) {
    try {
      await this.#connection.into("helpers").insert({
        help_item_id: itemId,
        user_id: helperId,
      });
    } catch (e) {
      const err = e as Error;

      if (isHelperItemUserUniqueError(err)) {
        // allow them to continually add even if they are already added
        return;
      }

      throw err;
    }
  }

  async removeHelperFromItem(itemId: string, helperId: string) {
    await this.#connection
      .into("helpers")
      .where({
        help_item_id: itemId,
        user_id: helperId,
      })
      .delete();
  }

  getHelpersForItem(itemId: string) {
    return this.#connection
      .from("help_items")
      .where("help_items.id", "=", itemId)
      .join("helpers", "helpers.help_item_id", "help_items.id")
      .join("users", "users.id", "helpers.user_id")
      .select(["users.id", "users.email", "users.meta"]);
  }

  async deleteById(id: string) {
    await this.#connection
      .from("help_items")
      .where({
        id,
      })
      .delete();
  }
}

export default HelpItemRepo;
