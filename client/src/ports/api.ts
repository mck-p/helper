import axios from "axios";
import * as Env from "@app/shared/env";
import * as R from "ramda";

/**
 * Our API sends everything under data
 * Axios wraps everything under data
 * So let's dewrap it all and just return
 * to you the value you want
 */
const APIDewrap = R.path<any>(["data", "data"]);

export const groups = {
  getBySlug: (slug: string) =>
    axios
      .get(`${Env.api.urlBase}/groups/slug/${encodeURIComponent(slug)}`)
      .then(APIDewrap),
  requestAccess: (request: {
    userId: string;
    sponsorId: string;
    groupId: string;
  }) =>
    axios
      .post(
        `${Env.api.urlBase}/groups/${request.groupId}/request-access/${request.userId}/${request.sponsorId}`
      )
      .then(APIDewrap),
  requestDemo: (email: string) =>
    axios
      .post(`${Env.api.urlBase}/groups/request-demo`, { email })
      .then(APIDewrap),
};

export const users = {
  getByEmail: (email: string): Promise<{ id: string }> =>
    axios.get(`${Env.api.urlBase}/users/by-email/${email}`).then(APIDewrap),
  getById: (id: string): Promise<{ id: string }> =>
    axios.get(`${Env.api.urlBase}/users/${id}`).then(APIDewrap),
  signup: ({
    email,
    password,
    name,
    referral,
  }: {
    email: string;
    password: string;
    name: string;
    referral: string;
  }) =>
    axios
      .post(`${Env.api.urlBase}/users`, {
        email,
        password,
        referral_email: referral,
        meta: {
          name,
        },
      })
      .then(APIDewrap),
  authenticate: ({ email, password }: { email: string; password: string }) =>
    axios
      .post(`${Env.api.urlBase}/users/authenticate`, { email, password })
      .then(APIDewrap),
};