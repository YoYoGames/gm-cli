export class KnownError extends Error {
  constructor(cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(message, cause instanceof Error ? { cause } : undefined);
    this.name = "KnownError";
  }
}
