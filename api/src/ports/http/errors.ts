export class ResourceNotFound extends Error {
  statusCode = 400;
  constructor(type: string, identifier: string) {
    super();

    this.message = `Cannot find "${type}" with id "${identifier}". Please change your query and try again.`;
  }
}

export class NotAuthorized extends Error {
  statusCode = 401;
  constructor() {
    super();

    this.message = `I'm sorry Dave, I'm afraid I can't do that.`;
  }
}
