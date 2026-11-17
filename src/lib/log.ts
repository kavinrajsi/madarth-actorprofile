/** Describe an error for logs without query parameters or personal data. */
export function safeError(err: unknown): string {
  if (!(err instanceof Error)) return 'unknown error';
  const cause = (err as {cause?: {code?: string; name?: string; message?: string}}).cause;
  // DrizzleQueryError messages embed query params (personal data): never log err.message for them.
  const code = cause?.code ? ` code=${cause.code}` : '';
  const causeName = cause?.name ? ` cause=${cause.name}` : '';
  return `${err.name}${code}${causeName}`;
}
