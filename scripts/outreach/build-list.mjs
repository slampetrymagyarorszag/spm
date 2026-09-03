/**
 * A végleges címzettlista összeállítása.
 *
 *   1. a kinyert nyers rekordok (scripts/outreach/extract.py kimenete)
 *   2. mínusz akik MÁR jelentkeztek a 2026-os bajnokságra (Sanity, formSubmission)
 *   3. mínusz a helyi tiltólista (outreach/private/suppress.txt) — ide kerül, aki leiratkozik
 *
 * A kimenet gitignore-olt: valódi címek nem kerülnek a repóba, se a nyilvános Sanitybe.
 *
 * Futtatás:  node --env-file=.env scripts/outreach/build-list.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { buildList } from './lib.mjs';

const RAW = 'outreach/private/raw-records.json';
const SUPPRESS = 'outreach/private/suppress.txt';
const OUT = 'outreach/private/recipients.json';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;
if (!projectId || !dataset) {
  console.error('Hiányzik a PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET. Futtasd --env-file=.env kapcsolóval.');
  process.exit(1);
}

if (!existsSync(RAW)) {
  console.error(`Nincs meg a ${RAW}. Előbb futtasd: python scripts/outreach/extract.py`);
  process.exit(1);
}

const records = JSON.parse(readFileSync(RAW, 'utf8'));

// Akik már jelentkeztek a mostani bajnokságra — nekik nem küldünk emlékeztetőt.
const query = encodeURIComponent('*[_type=="formSubmission" && kind=="bajnoksag"].email');
const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`;
const res = await fetch(url);
if (!res.ok) {
  console.error(`A Sanity lekérdezés nem sikerült: HTTP ${res.status}`);
  process.exit(1);
}
const applied = ((await res.json()).result || [])
  .map((e) => String(e ?? '').trim().toLowerCase())
  .filter(Boolean);

const suppressed = existsSync(SUPPRESS)
  ? readFileSync(SUPPRESS, 'utf8').split('\n').map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#'))
  : [];

const excluded = [...new Set([...applied, ...suppressed])];
const list = buildList(records, excluded);

mkdirSync('outreach/private', { recursive: true });
writeFileSync(OUT, JSON.stringify(list, null, 1), 'utf8');

const uniqueRaw = new Set(records.map((r) => String(r.email).toLowerCase())).size;
const appliedUnique = new Set(applied).size;
console.log('Nyers előfordulás      :', records.length);
console.log('Egyedi cím             :', uniqueRaw);
console.log('Már jelentkezett (2026):', appliedUnique, '— ebből a listán:', uniqueRaw - list.length - suppressed.filter((s) => !applied.includes(s)).length);
console.log('Helyi tiltólistán      :', suppressed.length);
console.log('VÉGLEGES CÍMZETT       :', list.length, '->', OUT);
