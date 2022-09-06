import * as API from "@app/ports/api";

export const isUserAdmin = async (userId: string, groupId: string) =>
  API.groups.isUserAdmin(userId, groupId);
