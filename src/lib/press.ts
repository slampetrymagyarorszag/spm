import { createHmac, timingSafeEqual } from 'node:crypto';
import { escapeHtml as esc } from './escape';

/**
 * Sajtóközlemény-kiküldés tiszta logikája: leiratkozó-token, címzettlista és levéltörzs.
 * Külön modul, mert ez a rész tesztelhető email-küldés nélkül is.
 */

export type PressContact = {
  _id?: string;
  name?: string;
  email?: string;
  outlet?: string;
  tags?: string[];
  subscribed?: boolean;
};

const EMAIL_RE = /^[^\s@<>,;:()[\]]+@[^\s@<>,;:()[\]]+\.[a-z]{2,}$/i;

/**
 * Leiratkozó-token: a címből és a szerver-titokból számolt HMAC. Így a leiratkozó link
 * bejelentkezés nélkül is működik, de nem lehet más címére hamisítani.
 */
export function unsubscribeToken(email: string, secret: string): string {
  return createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string, secret: string): boolean {
  if (!email || !token || !secret) return false;
  const expected = unsubscribeToken(email, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(token));
  // Azonos hossz nélkül a timingSafeEqual dobna; a hosszkülönbség önmagában is elutasítás.
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * A kiküldés címzettjei. Csak feliratkozott, érvényes címek, kis-nagybetűtől függetlenül
 * deduplikálva. Ha `tag` van megadva, csak az azzal címkézett kontaktok.
 */
export function buildRecipients(contacts: PressContact[], tag?: string): PressContact[] {
  const out: PressContact[] = [];
  const seen = new Set<string>();
  for (const c of contacts || []) {
    if (c?.subscribed === false) continue;
    const email = String(c?.email ?? '').trim();
    if (!EMAIL_RE.test(email)) continue;
    if (tag && !(c.tags || []).includes(tag)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...c, email: key });
  }
  return out;
}

/** Egyenlő méretű csomagok (a Resend kötegelt küldéséhez). */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error('A csomagméret legalább 1 legyen.');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** A közlemény szövegéből bekezdések (üres sorok mentén). */
export function toParagraphs(body: string): string[] {
  return String(body || '')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\r/g, '').trim())
    .filter(Boolean);
}

export function renderPressEmailHtml(input: {
  subject: string;
  body: string;
  unsubscribeUrl: string;
  siteUrl?: string;
  orgName?: string;
}): string {
  const org = input.orgName || 'Slam Poetry Magyarország';
  const site = input.siteUrl || 'https://slampoetry.hu';
  const paras = toParagraphs(input.body)
    .map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n  ');
  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#17171c;max-width:600px">
  <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">${esc(input.subject)}</h1>
  ${paras}
  <hr style="border:0;border-top:1px solid #e4e4e7;margin:28px 0 12px">
  <p style="color:#5a5560;font-size:12px;margin:0">
    ${esc(org)} · <a href="${esc(site)}" style="color:#b13bd6">${esc(site.replace(/^https?:\/\//, ''))}</a><br>
    Ezt a levelet sajtólistánk tagjaként kaptad.
    <a href="${esc(input.unsubscribeUrl)}" style="color:#5a5560">Leiratkozás</a>
  </p>
</div>`;
}
