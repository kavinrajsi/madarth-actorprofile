const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDraftId(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v);
}

export function draftPrefix(draftId: string): string {
  return `submissions/${draftId}/`;
}

/** Pathname must live directly under this draft's folder, with a safe file name. */
export function isPathInDraft(pathname: string, draftId: string): boolean {
  const prefix = draftPrefix(draftId);
  if (!pathname.startsWith(prefix)) return false;
  const rest = pathname.slice(prefix.length);
  return /^[A-Za-z0-9._-]{1,200}$/.test(rest) && !rest.includes('..');
}
