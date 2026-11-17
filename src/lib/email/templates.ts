/** Transactional email templates (HTML + plain text). Light background for client compatibility. */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]!);

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">
<tr><td style="background:#111111;padding:20px 28px;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:1px;color:#ffffff;">MADARTH<sup style="font-size:9px;">&reg;</sup></td></tr>
<tr><td style="height:4px;background:#fddb45;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:24px;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px 28px;font-size:12px;line-height:18px;color:#666666;border-top:1px solid #eeeeee;">
Madarth Casting &middot; Madarth never charges actors a fee for registration or auditions.<br>
You are receiving this because this email address was used to register an actor profile.</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:#fddb45;">
<a href="${esc(href)}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:bold;color:#000000;text-decoration:none;">${esc(label)}</a>
</td></tr></table>
<p style="margin:0;font-size:13px;line-height:20px;color:#666666;">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all;">${esc(href)}</span></p>`;
}

export type Email = {subject: string; html: string; text: string};

export function thankYouEmail(p: {name: string; code: string; hasAccount?: boolean; loginUrl?: string}): Email {
  const subject = `Thank you for registering with Madarth Casting (${p.code})`;
  const html = layout(
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px;">Thank you, ${esc(p.name)}.</h1>
<p style="margin:0 0 16px;">We have received your actor profile. Our casting team reviews every profile for upcoming films, ads and campaigns.</p>
<p style="margin:0 0 8px;">Your actor registration ID:</p>
<p style="margin:0 0 16px;"><span style="display:inline-block;background:#fddb45;color:#000000;font-size:22px;font-weight:bold;letter-spacing:2px;padding:8px 14px;">${esc(p.code)}</span></p>
<p style="margin:0 0 16px;">Keep this ID for any follow-up. If you are shortlisted, we will contact you on WhatsApp or email.</p>
<p style="margin:0;">${
      p.hasAccount && p.loginUrl
        ? `You already have an account. <a href="${esc(p.loginUrl)}" style="color:#000000;">Sign in</a> to view and update this profile.`
        : "We'll send you a separate email with a link to set up your account, where you can view and update your profile."
    }</p>`,
  );
  const text = `Thank you, ${p.name}.

We have received your actor profile. Our casting team reviews every profile for upcoming films, ads and campaigns.

Your actor registration ID: ${p.code}

Keep this ID for any follow-up. If you are shortlisted, we will contact you on WhatsApp or email.
${
    p.hasAccount && p.loginUrl
      ? `You already have an account. Sign in to view and update this profile: ${p.loginUrl}`
      : "We'll send you a separate email with a link to set up your account, where you can view and update your profile."
  }

Madarth never charges actors a fee for registration or auditions.`;
  return {subject, html, text};
}

export function inviteEmail(p: {name: string; email: string; link: string; days: number}): Email {
  const subject = 'Set up your Madarth Casting account';
  const html = layout(
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px;">Your actor account is ready</h1>
<p style="margin:0 0 16px;">Hi ${esc(p.name)}, create a password to sign in, check your profile status, update your details and replace your photos.</p>
<p style="margin:0;">Your login email: <strong>${esc(p.email)}</strong></p>
${button(p.link, 'Set my password')}
<p style="margin:16px 0 0;font-size:14px;color:#444444;">This link works once and expires in ${p.days} days. Didn't register? You can ignore this email.</p>`,
  );
  const text = `Your actor account is ready

Hi ${p.name}, create a password to sign in, check your profile status, update your details and replace your photos.
Your login email: ${p.email}

Set your password: ${p.link}

This link works once and expires in ${p.days} days. Didn't register? You can ignore this email.`;
  return {subject, html, text};
}

export function passwordResetEmail(p: {link: string; minutes: number}): Email {
  const subject = 'Reset your Madarth Casting password';
  const html = layout(
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px;">Reset your password</h1>
<p style="margin:0;">We received a request to reset the password for your Madarth Casting account.</p>
${button(p.link, 'Choose a new password')}
<p style="margin:16px 0 0;font-size:14px;color:#444444;">This link works once and expires in ${p.minutes} minutes. If you didn't ask for this, ignore this email; your password won't change.</p>`,
  );
  const text = `Reset your password

We received a request to reset the password for your Madarth Casting account.
Choose a new password: ${p.link}

This link works once and expires in ${p.minutes} minutes. If you didn't ask for this, ignore this email.`;
  return {subject, html, text};
}

/** Security notice (two-factor / passkey changes). Never contains codes or secrets. */
export function securityEmail(p: {heading: string; message: string; loginUrl: string; contactEmail: string}): Email {
  const subject = `Security alert: ${p.heading}`;
  const html = layout(
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px;">${esc(p.heading)}</h1>
<p style="margin:0;">${esc(p.message)}</p>
${button(p.loginUrl, 'Open my account')}
<p style="margin:16px 0 0;font-size:14px;color:#444444;">If this wasn't you, reset your password straight away and email ${esc(p.contactEmail)} so we can secure your account.</p>`,
  );
  const text = `${p.heading}

${p.message}
Open my account: ${p.loginUrl}

If this wasn't you, reset your password straight away and email ${p.contactEmail} so we can secure your account.`;
  return {subject, html, text};
}
