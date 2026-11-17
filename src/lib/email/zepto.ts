import 'server-only';

/**
 * Minimal Zoho ZeptoMail client (India data centre by default).
 * Env: ZEPTOMAIL_TOKEN (Send Mail token, with or without the "Zoho-enczapikey " prefix),
 *      ZEPTOMAIL_FROM (default noreply@madarth.com), ZEPTOMAIL_FROM_NAME, ZEPTOMAIL_API_URL.
 */
export type SendResult = {status: 'sent'; providerId: string | null} | {status: 'skipped' | 'failed'; error: string};

export async function zeptoSend(msg: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const raw = process.env.ZEPTOMAIL_TOKEN?.trim();
  if (!raw) return {status: 'skipped', error: 'ZEPTOMAIL_TOKEN not set'};
  const auth = raw.startsWith('Zoho-enczapikey') ? raw : `Zoho-enczapikey ${raw}`;
  const url = process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.in/v1.1/email';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json', Authorization: auth},
      body: JSON.stringify({
        from: {
          address: process.env.ZEPTOMAIL_FROM || 'noreply@madarth.com',
          name: process.env.ZEPTOMAIL_FROM_NAME || 'Madarth Casting',
        },
        to: [{email_address: {address: msg.to, name: msg.toName ?? msg.to}}],
        subject: msg.subject,
        htmlbody: msg.html,
        textbody: msg.text,
        track_clicks: false,
        track_opens: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      request_id?: string;
      data?: {additional_info?: unknown}[];
      error?: {code?: string; message?: string; details?: {message?: string}[]};
    };
    if (!res.ok) {
      const e = body.error;
      // Provider error text only (never the message body or recipient).
      return {status: 'failed', error: `${res.status} ${e?.code ?? ''} ${e?.details?.[0]?.message ?? e?.message ?? ''}`.trim()};
    }
    return {status: 'sent', providerId: body.request_id ?? null};
  } catch (err) {
    return {status: 'failed', error: err instanceof Error ? err.name + ': ' + err.message : 'unknown error'};
  }
}
