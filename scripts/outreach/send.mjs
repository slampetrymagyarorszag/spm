/**
 * A megkereső kampány kiküldése — egyenként, a Resend API-n át.
 *
 *   node --env-file=.env scripts/outreach/send.mjs --dry-run
 *   node --env-file=.env scripts/outreach/send.mjs --test=valaki@pelda.hu
 *   node --env-file=.env scripts/outreach/send.mjs --confirm=147
 *
 * Biztonsági elvek:
 *  - alapból SEMMIT nem küld: éles küldéshez a --confirm=<pontos darabszám> kell,
 *    és ha a lista időközben változott, leáll;
 *  - minden kiküldött cím azonnal bekerül a naplóba, és egy újrafuttatás
 *    kihagyja őket — így egy megszakadás után sem kap senki két levelet;
 *  - a hibás címek nem állítják meg a futást, a végén listázza őket.
 *
 * Megjegyzés: a hálózati hívás után NEM hívunk process.exit()-et, mert Windowson
 * a még nyitott keep-alive socket miatt a Node leállás közben elhasal (libuv assert).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { SUBJECT, renderOutreachEmail, renderOutreachText } from './email.mjs';

const LIST = 'outreach/private/recipients.json';
const SENT_LOG = 'outreach/output/sent.jsonl';
const APPLY_URL = process.env.OUTREACH_APPLY_URL || 'https://slampoetry.hu/?jelentkezes=1';
const CONTACT = process.env.OUTREACH_CONTACT_EMAIL || 'contest@slampoetry.hu';

const args = process.argv.slice(2);
const arg = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : true;
};
const dryRun = !!arg('dry-run');
const testTo = typeof arg('test') === 'string' ? arg('test') : '';
const confirm = arg('confirm');

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM || 'Slam Poetry Magyarország <no-reply@slampoetry.hu>';

async function sendOne({ email, name }) {
  const payload = {
    from,
    to: [email],
    reply_to: CONTACT,
    subject: SUBJECT,
    html: renderOutreachEmail({ name, applyUrl: APPLY_URL, contactEmail: CONTACT }),
    text: renderOutreachText({ name, applyUrl: APPLY_URL, contactEmail: CONTACT }),
    headers: { 'List-Unsubscribe': `<mailto:${CONTACT}?subject=Leiratkozas>` },
  };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
  return body?.id || '';
}

async function main() {
  if (!existsSync(LIST)) {
    console.error(`Nincs meg a ${LIST}. Előbb: node --env-file=.env scripts/outreach/build-list.mjs`);
    process.exitCode = 1;
    return;
  }
  const recipients = JSON.parse(readFileSync(LIST, 'utf8'));

  // --- 1) Szárazpróba: nem küld semmit, csak megmutatja, mi menne ki ---
  if (dryRun) {
    mkdirSync('outreach/output', { recursive: true });
    const sample = recipients[0] || { email: 'pelda@lap.hu', name: 'Példa Péter' };
    writeFileSync(
      'outreach/output/preview.html',
      renderOutreachEmail({ name: sample.name, applyUrl: APPLY_URL, contactEmail: CONTACT }),
      'utf8',
    );
    console.log('SZÁRAZPRÓBA — nem ment ki levél.');
    console.log('Címzettek        :', recipients.length);
    console.log('Feladó           :', from);
    console.log('Válaszcím        :', CONTACT);
    console.log('Tárgy            :', SUBJECT);
    console.log('Gomb célja       :', APPLY_URL);
    console.log('Előnézet         : outreach/output/preview.html');
    console.log('\nElső 5 címzett:');
    for (const r of recipients.slice(0, 5)) console.log('  ', r.email, '|', r.name || '(nincs név)');
    return;
  }

  if (!apiKey) {
    console.error('Hiányzik a RESEND_API_KEY. Futtasd --env-file=.env kapcsolóval.');
    process.exitCode = 1;
    return;
  }

  // --- 2) Teszt egyetlen címre ---
  if (testTo) {
    const id = await sendOne({ email: testTo, name: 'Teszt Elek' });
    console.log(`Teszt-levél elküldve ide: ${testTo} (id: ${id})`);
    return;
  }

  // --- 3) Éles kiküldés ---
  if (confirm === undefined) {
    console.error('Éles kiküldéshez add meg a pontos darabszámot:');
    console.error(`  node --env-file=.env scripts/outreach/send.mjs --confirm=${recipients.length}`);
    process.exitCode = 1;
    return;
  }
  if (Number(confirm) !== recipients.length) {
    console.error(`A lista ${recipients.length} címet tartalmaz, te ${confirm}-at erősítettél meg. Ellenőrizd, majd futtasd újra.`);
    process.exitCode = 1;
    return;
  }

  mkdirSync('outreach/output', { recursive: true });
  const alreadySent = new Set(
    existsSync(SENT_LOG)
      ? readFileSync(SENT_LOG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).email)
      : [],
  );
  if (alreadySent.size) console.log(`A napló szerint ${alreadySent.size} címre már kiment — ezeket kihagyom.`);

  const failed = [];
  let sent = 0;
  for (const [i, r] of recipients.entries()) {
    if (alreadySent.has(r.email)) continue;
    try {
      const id = await sendOne(r);
      appendFileSync(SENT_LOG, JSON.stringify({ email: r.email, name: r.name, id, at: new Date().toISOString() }) + '\n', 'utf8');
      sent++;
      if (sent % 20 === 0) console.log(`  ${sent} levél elment…`);
    } catch (e) {
      failed.push({ email: r.email, error: String(e.message || e) });
      console.error(`  HIBA ${r.email}: ${e.message || e}`);
    }
    // A szolgáltató percenkénti korlátja miatt lassítunk (kb. 2 levél/mp alatt maradunk).
    if (i < recipients.length - 1) await new Promise((res) => setTimeout(res, 600));
  }

  writeFileSync(
    `outreach/output/report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
    JSON.stringify({ total: recipients.length, sent, failed, at: new Date().toISOString() }, null, 1),
    'utf8',
  );
  console.log(`\nKÉSZ — ${sent} levél ment ki, ${failed.length} hiba.`);
  if (failed.length) for (const f of failed) console.log('  ', f.email, '->', f.error);
  console.log('Napló: ' + SENT_LOG);
}

await main();
