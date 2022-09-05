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
  getBySlug: (slug: string, authToken: string) =>
    axios
      .get(`${Env.api.urlBase}/groups/slug/${encodeURIComponent(slug)}`)
      .then(APIDewrap),
  getById: (id: string, authToken: string) =>
    axios.get(`${Env.api.urlBase}/groups/${id}`).then(APIDewrap),
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
  getById: (id: string): Promise<{ id: string; meta: { [x: string]: any } }> =>
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
  getHelpItemsByUserId: (id: string, query?: string, authToken?: string) =>
    axios
      .get(`${Env.api.urlBase}/users/${id}/help-items?${query}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
  getHelpRequesrtsByUserId: (id: string, query?: string, authToken?: string) =>
    axios
      .get(`${Env.api.urlBase}/users/${id}/help-requests?${query}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
  getGroupsByUserId: (id: string, query?: string, authToken?: string) =>
    axios.get(`${Env.api.urlBase}/users/${id}/groups?${query}`).then(APIDewrap),
  userIsInGroup: (userId: string, slug: string) =>
    axios
      .get(`${Env.api.urlBase}/users/${userId}/in-group/${slug}`)
      .then(APIDewrap),
  usersInGroup: (groupId: string, authToken: string) =>
    axios
      .get(`${Env.api.urlBase}/groups/${groupId}/members`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
  updateProfile: (userId: string, update: any, authToken: string) =>
    axios
      .patch(`${Env.api.urlBase}/users/${userId}/meta`, update, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
};

export const helpItems = {
  getById: (id: string, authToken: string) =>
    axios
      .get(`${Env.api.urlBase}/help-items/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
  create: (
    {
      title,
      description,
      group_id,
      user_id,
      image,
      end_at,
    }: {
      title: string;
      description: string;
      group_id: string;
      user_id: string;
      image: string;
      end_at: string;
    },
    authToken: string
  ) =>
    axios
      .post(
        `${Env.api.urlBase}/help-items/`,
        {
          title,
          description,
          group_id,
          image,
          end_at,
          creator_id: user_id,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )
      .then(APIDewrap),
  offerHelp: ({ help_item, user_id }: any, authToken: string) =>
    axios
      .post(
        `${Env.api.urlBase}/help-items/${help_item}/add-helper/${user_id}`,
        undefined,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )
      .then(APIDewrap),
  cancelHelp: ({ help_item, user_id }: any, authToken: string) =>
    axios
      .post(
        `${Env.api.urlBase}/help-items/${help_item}/remove-helper/${user_id}`,
        undefined,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )
      .then(APIDewrap),
  getHelpersForHelpItem: (help_item: string, authToken: string) =>
    axios
      .get(`${Env.api.urlBase}/help-items/${help_item}/helpers`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
  getHelpItemsForGroup: (group_id: string, authToken: string) =>
    axios
      .get(`${Env.api.urlBase}/groups/${group_id}/help-items`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
  delete: (helpItem: string, authToken: string) =>
    axios
      .delete(`${Env.api.urlBase}/help-items/${helpItem}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
  update: (helpItem: string, update: any, authToken: string) =>
    axios
      .patch(`${Env.api.urlBase}/help-items/${helpItem}`, update, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then(APIDewrap),
};
