export class ActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message.includes(String(status)) ? message : `[${status}] ${message}`)
  }
}
