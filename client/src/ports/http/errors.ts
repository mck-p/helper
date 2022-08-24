export class ResourceNotFound extends Error {
  statusCode = 400;
  constructor(type: string, identifier: string) {
    super();

    this.message = `Cannot find "${type}" with id "${identifier}". Please change your query and try again.`;
  }
}

export class MustBeAuthenticated extends Error {
  statusCode = 401;
  constructor() {
    super();

    this.message = `You must be authenticated to perform that action. Please log into the system and try again.`;
  }
}
