import axios from "axios";
import * as Env from "@app/shared/env";

export const groups = {
  getBySlug: (slug: string) =>
    axios
      .get(`${Env.api.urlBase}/groups/slug/${encodeURIComponent(slug)}`)
      .then(({ data }) => data.data),
};
