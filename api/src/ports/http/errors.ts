export class ResourceNotFound extends Error {
  statusCode = 400;
  constructor(type: string, identifier: string) {
    super();

    this.message = `Cannot find "${type}" with id "${identifier}". Please change your query and try again.`;
  }
}
