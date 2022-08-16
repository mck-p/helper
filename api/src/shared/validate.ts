import { Validator } from "jsonschema";
import type { Schema as Sc } from "jsonschema";

export type Schema = Sc;
const validator = new Validator();

export const validate = (data: unknown, schema: Schema) =>
  validator.validate(data, schema, {
    throwAll: true,
  });

export default validate;
