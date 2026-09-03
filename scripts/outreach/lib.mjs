// Az előválogatós megkereső kampány tiszta segédfüggvényei.
// Külön modul, hogy tesztelhető legyen Excel és email-küldés nélkül is.

export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Egy cella szövegéből az összes benne lévő email cím, kisbetűsen. */
export function emailsIn(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(EMAIL_RE)) out.push(m[0].toLowerCase());
  return out;
}

/**
 * Névnek látszik-e a cella. A táblákban a név általában az email mellett áll, de van
 * fejléc, dátum, „STB”, „Igen” és üres cella is — ezeket ki kell szűrni.
 */
export function looksLikeName(s) {
  const v = String(s ?? '').trim();
  if (!v || v.length < 4 || v.length > 60) return false;
  if (EMAIL_RE.test(v)) { EMAIL_RE.lastIndex = 0; return false; }
  EMAIL_RE.lastIndex = 0;
  if (/^\d/.test(v)) return false;                    // dátum, sorszám
  if (/^(stb|igen|nem|nan|none|null)$/i.test(v)) return false;
  if (/^(https?:|www\.)/i.test(v)) return false;
  return /[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]/.test(v);
}

/** A sorban az email cellájához legközelebbi név: előbb balra, aztán jobbra keresünk. */
export function nameNearest(cells, emailIndex) {
  for (let j = emailIndex - 1; j >= 0; j--) if (looksLikeName(cells[j])) return String(cells[j]).trim();
  for (let j = emailIndex + 1; j < cells.length; j++) if (looksLikeName(cells[j])) return String(cells[j]).trim();
  return '';
}

/**
 * Címzettlista összeállítása: kisbetűsítés, deduplikálás, a kizárt címek elhagyása.
 * Ha ugyanaz a cím többször szerepel, a leghosszabb (legtöbb infót hordozó) nevet tartjuk meg.
 */
export function buildList(records, excluded = []) {
  const skip = new Set([...excluded].map((e) => String(e).trim().toLowerCase()).filter(Boolean));
  const byEmail = new Map();
  for (const r of records || []) {
    const email = String(r?.email ?? '').trim().toLowerCase();
    if (!email || skip.has(email)) continue;
    const name = String(r?.name ?? '').trim();
    const prev = byEmail.get(email);
    if (!prev) byEmail.set(email, { email, name, sources: [r.source].filter(Boolean) });
    else {
      if (name.length > prev.name.length) prev.name = name;
      if (r.source && !prev.sources.includes(r.source)) prev.sources.push(r.source);
    }
  }
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

// A régi űrlapokon sokan a névmezőbe írtak megjegyzést vagy várost. Ezeket ki kell szűrni:
// jobb egy semleges „Szia!”, mint egy „Szia Budapest!”.
const CITY_ONLY = new Set([
  'budapest', 'szolnok', 'százhalombatta', 'debrecen', 'pécs', 'győr', 'kecskemét', 'miskolc',
  'szeged', 'eger', 'veszprém', 'sopron', 'nyíregyháza', 'békéscsaba', 'kaposvár', 'szombathely',
  'zalaegerszeg', 'tatabánya', 'dunaújváros', 'esztergom', 'vác', 'gödöllő', 'törökbálint',
  'andocs', 'karmacs', 'balatonföldvár', 'nagykanizsa', 'mogyorósbánya', 'malgersdorf', 'szentendre',
]);

// FIGYELEM: a JS `\b` csak az [A-Za-z0-9_] halmazt ismeri, ezért az ékezetes betűk előtt
// szóhatárt lát — a „Teodóra” így beleakadna az „óra” szóba. Saját, ékezet-tudatos határ kell.
const HU = 'A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű';
const COMMENT_WORDS = new RegExp(
  `(?<![${HU}])(?:nem|jó|jónak|köszi|köszönöm|tudok|tudnék|tudom|lenne|leszek|esetleg|élek|` +
    `születtem|óra|órakor|délután|délelőtt|este|estét|esti|reggel|miatt|valószínűséggel|részt|` +
    `venni|megoldani|alkalmas|tartozom|slamelek|hétfő|kedd|szerda|csütörtök|péntek|szombat|` +
    `vasárnap|szept|szeptember)(?![${HU}])`,
  'i',
);

/**
 * A névmezőből a tényleges név: levágjuk a zárójeles/kötőjeles/perjeles kiegészítést
 * („Venczel Patrik (Edvárd, a bárd)” → „Venczel Patrik”) és a záró írásjelet.
 */
export function cleanName(name) {
  return String(name ?? '')
    .replace(/\s*[(/].*$/s, '')
    .replace(/\s+[-–—]\s+.*$/s, '')
    .replace(/[.,;:!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Személynévnek tekinthető-e a megtisztított érték? Kétes esetben NEM. */
export function isPersonName(name) {
  const raw = String(name ?? '');
  // A szűrőszavakat az EREDETI szövegen keressük: a megjegyzés gyakran épp abban a
  // részben van, amit a cleanName levág (pl. „… (09.23.) nem tudom megoldani”).
  if (COMMENT_WORDS.test(raw)) return false;
  const v = cleanName(raw);
  if (!v || v.length < 3 || v.length > 40) return false;
  if (/\d/.test(v)) return false;
  if (/[,;!?]/.test(v)) return false;
  // A pont csak névbeli kezdőbetűnél megengedett („Vörös E. Hargita”), mondatvégként nem.
  if (/\./.test(v.replace(/(?:^|\s)[A-ZÁÉÍÓÖŐÚÜŰ]\./g, ' '))) return false;
  if (!v.includes(' ') && CITY_ONLY.has(v.toLowerCase())) return false;
  return /[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]/.test(v);
}

/** Megszólítás. Csak akkor személyre szóló, ha a név valóban névnek látszik. */
export function greeting(name) {
  return isPersonName(name) ? `Szia ${cleanName(name)}!` : 'Szia!';
}
