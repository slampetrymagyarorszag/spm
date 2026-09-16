/**
 * A XIV. SPOB előválogatóira jelentkezőknek: melyik napon lépnek színpadra.
 *
 *   node --env-file=.env scripts/outreach/send-groups.mjs --dry-run
 *   node --env-file=.env scripts/outreach/send-groups.mjs --test=valaki@pelda.hu
 *   node --env-file=.env scripts/outreach/send-groups.mjs --confirm=82
 *
 * Ugyanazok a biztonsági elvek, mint a megkereső kampánynál: éles küldéshez a pontos
 * darabszám kell, minden kiment cím azonnal naplóba kerül (egy megszakadás után sem kap
 * senki két levelet), a hibás címek nem állítják meg a futást, és a hálózati hívás után
 * nincs process.exit() (Windowson libuv-assertet dobna).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { SUBJECT, renderGroupsEmail, renderGroupsText } from './email-groups.mjs';

const LIST = 'outreach/private/applicants.json';
const SENT_LOG = 'outreach/output/sent-groups.jsonl';
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
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: CONTACT,
      subject: SUBJECT,
      html: renderGroupsEmail({ name, contactEmail: CONTACT }),
      text: renderGroupsText({ name, contactEmail: CONTACT }),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
  return body?.id || '';
}

async function main() {
  if (!existsSync(LIST)) {
    console.error(`Nincs meg a ${LIST}.`);
    process.exitCode = 1;
    return;
  }
  const recipients = JSON.parse(readFileSync(LIST, 'utf8'));

  if (dryRun) {
    mkdirSync('outreach/output', { recursive: true });
    const sample = recipients[0] || { email: 'pelda@lap.hu', name: 'Példa Péter' };
    writeFileSync('outreach/output/preview-groups.html', renderGroupsEmail({ name: sample.name, contactEmail: CONTACT }), 'utf8');
    const named = recipients.filter((r) => renderGroupsText({ name: r.name }).startsWith('Szia')).length;
    console.log('SZÁRAZPRÓBA — nem ment ki levél.');
    console.log('Címzettek        :', recipients.length);
    console.log('  nevén szólítva :', named);
    console.log('  semlegesen     :', recipients.length - named);
    console.log('Feladó           :', from);
    console.log('Válaszcím        :', CONTACT);
    console.log('Tárgy            :', SUBJECT);
    console.log('Előnézet         : outreach/output/preview-groups.html');
    return;
  }

  if (!apiKey) {
    console.error('Hiányzik a RESEND_API_KEY.');
    process.exitCode = 1;
    return;
  }

  if (testTo) {
    const id = await sendOne({ email: testTo, name: 'Teszt Elek' });
    console.log(`Teszt-levél elküldve ide: ${testTo} (id: ${id})`);
    return;
  }

  if (confirm === undefined) {
    console.error(`Éles kiküldéshez: node --env-file=.env scripts/outreach/send-groups.mjs --confirm=${recipients.length}`);
    process.exitCode = 1;
    return;
  }
  if (Number(confirm) !== recipients.length) {
    console.error(`A lista ${recipients.length} címet tartalmaz, te ${confirm}-at erősítettél meg.`);
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
    if (i < recipients.length - 1) await new Promise((res) => setTimeout(res, 600));
  }

  writeFileSync(
    `outreach/output/report-groups-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
    JSON.stringify({ total: recipients.length, sent, failed, at: new Date().toISOString() }, null, 1),
    'utf8',
  );
  console.log(`\nKÉSZ — ${sent} levél ment ki, ${failed.length} hiba.`);
  if (failed.length) for (const f of failed) console.log('  ', f.email, '->', f.error);
}

await main();
