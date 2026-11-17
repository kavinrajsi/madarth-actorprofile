import 'server-only';
import {getDb, schema} from '@/db';
import type {Email} from './templates';
import {zeptoSend} from './zepto';

type Kind = (typeof schema.emailEvents.$inferInsert)['kind'];

/** Sends one email and records the outcome (no addresses or bodies are logged). Never throws. */
export async function sendAndLog(opts: {to: string; toName?: string; kind: Kind; actorId?: string | null; email: Email}) {
  const result = await zeptoSend({to: opts.to, toName: opts.toName, ...opts.email});
  try {
    await getDb()
      .insert(schema.emailEvents)
      .values({
        actorId: opts.actorId ?? null,
        kind: opts.kind,
        status: result.status,
        providerId: result.status === 'sent' ? result.providerId : null,
        error: result.status === 'sent' ? null : result.error.slice(0, 300),
      });
  } catch {
    // Logging must never break the user flow.
  }
  if (result.status !== 'sent') console.warn(`[email] ${opts.kind} ${result.status}: ${result.error}`);
  return result;
}
