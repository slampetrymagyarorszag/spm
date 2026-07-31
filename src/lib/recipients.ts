/**
 * A látogatói beküldésekről (slammer-jelentkezés, esemény-tipp, klub-bejelentés,
 * slammer-adatmódosítás) szóló értesítők címzettjei.
 *
 * Korábban ezek az értesítők a Studio „Értesítés beküldésekről" kapcsolójától függtek:
 * ha a kapcsoló ki volt kapcsolva vagy a cím üresen maradt, a beküldésről SENKI nem
 * kapott emailt — a dokumentum csak csendben megjelent a Sanityben. Ezért van egy
 * tartalék cím, ami MINDIG kap értesítést; a Studio-beli cím ezen felül jön.
 */

/** A tartalék címzett, ha nincs `NOTIFY_FALLBACK_EMAIL` env változó. */
export const DEFAULT_NOTIFY_EMAIL = 'media@slampoetry.hu';

export type NotifySettings = { notifyEmail?: string; notifyOnSubmissions?: boolean };

// Szándékosan szigorú: whitespace és soremelés nem fér bele, így fejléc-injekció
// (CRLF + „Bcc:") nem juthat át a címzett-listán.
const EMAIL_RE = /^[^\s@,;:<>()[\]\\]+@[^\s@,;:<>()[\]\\]+\.[a-z]{2,}$/i;

/**
 * A beküldés-értesítő címzettjei, sorrendben: tartalék cím, majd a Studio címe,
 * majd a hívó extra címzettjei. Kis-nagybetűtől függetlenül deduplikál, az
 * érvénytelen címeket eldobja.
 */
export function submissionRecipients(
  emails: NotifySettings | undefined,
  fallback: string,
  ...extra: (string | undefined | null)[]
): string[] {
  const candidates: (string | undefined | null)[] = [fallback];
  if (emails?.notifyOnSubmissions && emails.notifyEmail) candidates.push(emails.notifyEmail);
  candidates.push(...extra);

  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of candidates) {
    const addr = String(raw ?? '').trim();
    if (!EMAIL_RE.test(addr)) continue;
    const key = addr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * A tartalék cím env-ből (Vercel: `NOTIFY_FALLBACK_EMAIL`), alapértelmezés a media@.
 * Több env-forrást is elfogad, mert az Astro szerver-oldalon hol az `import.meta.env`-ben,
 * hol a `process.env`-ben látszik a változó (ugyanígy hedge-el a mailer.ts is).
 */
export function notifyFallbackEmail(...envs: (Record<string, any> | undefined)[]): string {
  for (const env of envs) {
    const v = env?.NOTIFY_FALLBACK_EMAIL;
    if (v) return String(v).trim();
  }
  return DEFAULT_NOTIFY_EMAIL;
}
