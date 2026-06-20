# English (HU/EN) Version — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an English version of the site behind a manual `/en/` language toggle, with a UI translation dictionary and `*_en` CMS fields that fall back to Hungarian when empty.

**Architecture:** Astro native i18n (`/en/` prefix, Hungarian stays at root). UI strings come from a `src/i18n` dictionary via `t(lang, key)`. CMS content has parallel `*_en` fields read through a `localized()` helper that falls back to Hungarian. A header `LangToggle` links the current page to its other-locale URL. `hreflang` tags for SEO.

**Tech Stack:** Astro 6, Sanity, TypeScript, Vitest, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-06-20-i18n-design.md`

**Conventions in this repo (follow these):**
- Tests: Vitest, files in `test/`, run with `npx vitest run`.
- Throwaway Sanity scripts: `node --env-file=.env scripts/X.mjs`, delete after running. Token: `process.env.SANITY_WRITE_TOKEN || process.env.SANITY_FORM_TOKEN`.
- Commit message footer line: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Verify previewable changes with the dev server (`npm run dev`, port 4321) before committing.

---

## Phase 1 — i18n core helpers + dictionary

### Task 1: Locale helpers (`src/i18n/index.ts`)

**Files:**
- Create: `src/i18n/index.ts`
- Test: `test/i18n.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getLangFromUrl, localizedPath, alternatePath, LOCALES, DEFAULT_LOCALE } from '../src/i18n';

describe('getLangFromUrl', () => {
  it('gyökér útvonal → hu', () => {
    expect(getLangFromUrl(new URL('https://x.hu/slammerek'))).toBe('hu');
  });
  it('/en/ előtag → en', () => {
    expect(getLangFromUrl(new URL('https://x.hu/en/slammerek'))).toBe('en');
  });
  it('csak /en → en', () => {
    expect(getLangFromUrl(new URL('https://x.hu/en'))).toBe('en');
  });
  it('ismeretlen első szegmens → hu', () => {
    expect(getLangFromUrl(new URL('https://x.hu/enxyz/a'))).toBe('hu');
  });
});

describe('localizedPath', () => {
  it('hu: nincs prefix', () => { expect(localizedPath('/slammerek', 'hu')).toBe('/slammerek'); });
  it('en: /en prefix', () => { expect(localizedPath('/slammerek', 'en')).toBe('/en/slammerek'); });
  it('gyökér hu', () => { expect(localizedPath('/', 'hu')).toBe('/'); });
  it('gyökér en', () => { expect(localizedPath('/', 'en')).toBe('/en'); });
  it('idegen (http) linket nem bánt', () => { expect(localizedPath('https://fb.com/x', 'en')).toBe('https://fb.com/x'); });
});

describe('alternatePath', () => {
  it('hu oldalról en-re', () => { expect(alternatePath('/slammerek', 'en')).toBe('/en/slammerek'); });
  it('en oldalról hu-ra', () => { expect(alternatePath('/en/slammerek', 'hu')).toBe('/slammerek'); });
  it('en gyökérről hu-ra', () => { expect(alternatePath('/en', 'hu')).toBe('/'); });
  it('hu gyökérről en-re', () => { expect(alternatePath('/', 'en')).toBe('/en'); });
});

describe('konstansok', () => {
  it('LOCALES', () => { expect(LOCALES).toEqual(['hu', 'en']); });
  it('DEFAULT_LOCALE', () => { expect(DEFAULT_LOCALE).toBe('hu'); });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/i18n.test.ts`
Expected: FAIL — cannot find module `../src/i18n`.

- [ ] **Step 3: Write minimal implementation**

Create `src/i18n/index.ts`:

```ts
export const LOCALES = ['hu', 'en'] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Lang = 'hu';

// Az URL első útvonal-szegmenséből olvassa ki a nyelvet. Ismeretlen → alapnyelv.
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return seg === 'en' ? 'en' : 'hu';
}

// Belső útvonal nyelv-prefixelése. HU: nincs prefix; EN: /en előtag.
// Külső (http/https/mailto) linkeket változatlanul hagy.
export function localizedPath(path: string, lang: Lang): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'hu') return clean;
  if (clean === '/') return '/en';
  return `/en${clean}`;
}

// Egy aktuális (esetleg /en-előtagos) útvonalat a másik nyelvre képez le.
export function alternatePath(currentPath: string, lang: Lang): string {
  // Vágjuk le az esetleges /en előtagot → „semleges" HU-útvonal
  let neutral = currentPath.replace(/^\/en(?=\/|$)/, '');
  if (neutral === '') neutral = '/';
  return localizedPath(neutral, lang);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/i18n.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/index.ts test/i18n.test.ts
git commit -m "feat(i18n): locale helpers (getLangFromUrl, localizedPath, alternatePath)"
```

---

### Task 2: UI dictionary + `t()` (`src/i18n/ui.ts`)

**Files:**
- Create: `src/i18n/ui.ts`
- Test: `test/i18n-ui.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/i18n-ui.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { t, ui } from '../src/i18n/ui';

describe('t()', () => {
  it('magyar kulcs', () => { expect(t('hu', 'nav.events')).toBe('Események'); });
  it('angol kulcs', () => { expect(t('en', 'nav.events')).toBe('Events'); });
  it('hiányzó angol kulcs → magyar fallback', () => {
    // szándékosan nem létező kulcs: a saját kulcsát adja vissza végső esetben
    expect(t('en', 'nincs.ilyen.kulcs')).toBe('nincs.ilyen.kulcs');
  });
  it('minden hu kulcsnak van en párja', () => {
    const huKeys = Object.keys(ui.hu);
    const enKeys = new Set(Object.keys(ui.en));
    const missing = huKeys.filter((k) => !enKeys.has(k));
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/i18n-ui.test.ts`
Expected: FAIL — cannot find module `../src/i18n/ui`.

- [ ] **Step 3: Write minimal implementation**

Create `src/i18n/ui.ts`. Start with the keys below; MORE keys get added in Phase 4 as components are wired (every added key needs both `hu` and `en` — the test enforces parity).

```ts
import type { Lang } from './index';

// Lapos kulcs→szöveg szótár. Új UI-szöveg felvételekor MINDKÉT nyelvhez add hozzá.
export const ui: Record<Lang, Record<string, string>> = {
  hu: {
    'nav.whatIsSlam': 'Mi az a slam?',
    'nav.events': 'Események',
    'nav.slammers': 'Slammerek',
    'nav.news': 'Hírek',
    'nav.media': 'Médiatár',
    'nav.association': 'Egyesület',
    'nav.contact': 'Kapcsolat',
    'lang.switchTo': 'English',
    'footer.impressum': 'Impresszum',
    'footer.contact': 'Kapcsolat',
    'footer.transparency': 'Átláthatóság',
    'footer.annualReports': 'Éves beszámolók',
    'footer.annualReportsSoon': 'Éves beszámolók (hamarosan)',
    'footer.getInTouch': 'Lépj kapcsolatba velünk →',
    'common.readMore': 'Tovább',
    'common.watchOnYoutube': 'Megnézem YouTube-on',
    'error404.title': 'Az oldal nem található',
    'error404.lead': 'Ez a vers nem rímel — a keresett oldal nincs meg.',
    'error404.home': 'Vissza a főoldalra',
  },
  en: {
    'nav.whatIsSlam': 'What is slam?',
    'nav.events': 'Events',
    'nav.slammers': 'Slammers',
    'nav.news': 'News',
    'nav.media': 'Media',
    'nav.association': 'Association',
    'nav.contact': 'Contact',
    'lang.switchTo': 'Magyar',
    'footer.impressum': 'Imprint',
    'footer.contact': 'Contact',
    'footer.transparency': 'Transparency',
    'footer.annualReports': 'Annual reports',
    'footer.annualReportsSoon': 'Annual reports (coming soon)',
    'footer.getInTouch': 'Get in touch →',
    'common.readMore': 'Read more',
    'common.watchOnYoutube': 'Watch on YouTube',
    'error404.title': 'Page not found',
    'error404.lead': 'This verse doesn’t rhyme — the page you’re looking for is gone.',
    'error404.home': 'Back to home',
  },
};

// Kulcs feloldása. Hiányzó EN kulcsnál HU-ra esik vissza; ha az sincs, a kulcsot adja.
export function t(lang: Lang, key: string): string {
  return ui[lang]?.[key] ?? ui.hu[key] ?? key;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/i18n-ui.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ui.ts test/i18n-ui.test.ts
git commit -m "feat(i18n): UI string dictionary with t() and hu/en parity test"
```

---

## Phase 2 — CMS `*_en` fields, localized helper, queries

### Task 3: `localized()` / `localizedField()` helpers

**Files:**
- Create: `src/i18n/content.ts`
- Test: `test/i18n-content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/i18n-content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { localized } from '../src/i18n/content';

describe('localized', () => {
  const doc = { title: 'Magyar cím', titleEn: 'English title', excerpt: 'HU', excerptEn: '' };
  it('hu nyelv → magyar mező', () => { expect(localized(doc, 'title', 'hu')).toBe('Magyar cím'); });
  it('en nyelv, van angol → angol', () => { expect(localized(doc, 'title', 'en')).toBe('English title'); });
  it('en nyelv, üres angol → magyar fallback', () => { expect(localized(doc, 'excerpt', 'en')).toBe('HU'); });
  it('en nyelv, hiányzó angol kulcs → magyar fallback', () => { expect(localized(doc, 'missing' as any, 'en')).toBeUndefined(); });
  it('null doc → undefined', () => { expect(localized(null, 'title', 'en')).toBeUndefined(); });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/i18n-content.test.ts`
Expected: FAIL — cannot find module `../src/i18n/content`.

- [ ] **Step 3: Write minimal implementation**

Create `src/i18n/content.ts`:

```ts
import type { Lang } from './index';

// Egy CMS-mező nyelvfüggő értéke. EN nyelvnél a `<mező>En` párt adja, ha az
// nem üres; különben a magyar mezőre esik vissza. Stringre és Portable Text
// (tömb) értékekre is működik (üresség: '' string vagy üres tömb).
function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function localized<T extends Record<string, any>>(
  doc: T | null | undefined,
  field: string,
  lang: Lang,
): any {
  if (!doc) return undefined;
  if (lang === 'en') {
    const en = doc[`${field}En`];
    if (!isEmpty(en)) return en;
  }
  return doc[field];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/i18n-content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/content.ts test/i18n-content.test.ts
git commit -m "feat(i18n): localized() CMS field helper with Hungarian fallback"
```

---

### Task 4: Add `*_en` fields to Sanity schemas

**Files:**
- Modify: `src/sanity/schemaTypes/post.ts`
- Modify: `src/sanity/schemaTypes/slammer.ts`
- Modify: `src/sanity/schemaTypes/event.ts`
- Modify: `src/sanity/schemaTypes/page.ts`
- Modify: `src/sanity/schemaTypes/siteSettings.ts` (the `home` object)

- [ ] **Step 1: `post.ts` — add EN fields after `body`**

In `src/sanity/schemaTypes/post.ts`, after the `body` field line, add:

```ts
    defineField({ name: 'titleEn', title: 'Cím (English)', type: 'string', description: 'Opcionális angol cím. Ha üres, az angol oldalon a magyar jelenik meg.' }),
    defineField({ name: 'excerptEn', title: 'Bevezető (English)', type: 'text', rows: 3 }),
    defineField({ name: 'bodyEn', title: 'Tartalom (English)', type: 'blockContent' }),
```

- [ ] **Step 2: `slammer.ts` — add EN bio after `bio`**

After the `bio` field in `src/sanity/schemaTypes/slammer.ts`:

```ts
    defineField({ name: 'bioEn', title: 'Bemutatkozás (English)', type: 'blockContent', description: 'Opcionális. Ha üres, az angol oldalon a magyar bio jelenik meg.' }),
```

- [ ] **Step 3: `event.ts` — add EN fields in the `details` group after `description`**

After the `description` field in `src/sanity/schemaTypes/event.ts`:

```ts
    defineField({ name: 'titleEn', title: 'Cím (English)', type: 'string', group: 'details' }),
    defineField({ name: 'descriptionEn', title: 'Leírás (English)', type: 'blockContent', group: 'details' }),
```

- [ ] **Step 4: `page.ts` — add EN fields after `body`**

After the `body` field in `src/sanity/schemaTypes/page.ts`:

```ts
    defineField({ name: 'titleEn', title: 'Cím (English)', type: 'string' }),
    defineField({ name: 'leadEn', title: 'Bevezető (English)', type: 'text', rows: 2 }),
    defineField({ name: 'bodyEn', title: 'Tartalom (English)', type: 'blockContent' }),
```

- [ ] **Step 5: `siteSettings.ts` — add EN hero fields in the `home` object**

Locate the `home` object's `fields` array in `src/sanity/schemaTypes/siteSettings.ts`. After the existing `heroSticker`/`heroTitle`/`heroLead` fields, add EN parallels (match the exact existing field names; add `En` suffix):

```ts
        defineField({ name: 'heroStickerEn', title: 'Hero matrica (English)', type: 'string' }),
        defineField({ name: 'heroTitleEn', title: 'Hero cím (English)', type: 'string' }),
        defineField({ name: 'heroLeadEn', title: 'Hero alcím (English)', type: 'text', rows: 2 }),
        defineField({ name: 'primaryCtaLabelEn', title: 'Elsődleges gomb szövege (English)', type: 'string' }),
        defineField({ name: 'secondaryCtaLabelEn', title: 'Másodlagos gomb szövege (English)', type: 'string' }),
```

- [ ] **Step 6: Verify the Studio compiles**

Start dev server if not running: `npm run dev`. Open `http://localhost:4321/admin`, wait ~6s, check there are no console errors. The new "(English)" fields should appear in the Hírek / Slammer / Esemény / Oldal / Beállítások editors.

- [ ] **Step 7: Commit**

```bash
git add src/sanity/schemaTypes/post.ts src/sanity/schemaTypes/slammer.ts src/sanity/schemaTypes/event.ts src/sanity/schemaTypes/page.ts src/sanity/schemaTypes/siteSettings.ts
git commit -m "feat(i18n): add optional *_en fields to post/slammer/event/page/siteSettings"
```

---

### Task 5: Fetch `*_en` fields in queries + extend types

**Files:**
- Modify: `src/sanity/lib/queries.ts`
- Modify: `src/sanity/lib/api.ts`

- [ ] **Step 1: Add `*_en` projections to queries**

In `src/sanity/lib/queries.ts`, extend these projections (add the EN fields next to their HU counterparts):

- `POSTS_QUERY`: add `titleEn, excerptEn`
- `POST_BY_SLUG_QUERY`: add `titleEn, excerptEn, bodyEn`
- `SLAMMER_BY_SLUG_QUERY`: add `bioEn`
- `EVENTS_QUERY`: add `titleEn`
- `EVENT_BY_SLUG_QUERY`: add `titleEn, descriptionEn`
- `SITE_SETTINGS_QUERY`: inside the existing `home` projection is implicit (`home` is fetched whole), so no change needed for home; confirm `home` is fetched as a whole object (it is: `home,`).
- `PAGE_BY_SLUG_QUERY`: add `titleEn, leadEn, bodyEn`

Example — `POST_BY_SLUG_QUERY` becomes:

```ts
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover, tags, body,
  titleEn, excerptEn, bodyEn,
  seo{ metaTitle, metaDescription, shareImage }
}`;
```

- [ ] **Step 2: Extend the TypeScript types in `api.ts`**

In `src/sanity/lib/api.ts`:

- `PostListItem`: add `titleEn?: string; excerptEn?: string;`
- `Post`: add `bodyEn?: any;`
- `Slammer`: add `bioEn?: any;`
- `EventListItem`: add `titleEn?: string;`
- `EventDetail`: add `descriptionEn?: any;`
- In the `SiteSettings.home` type, add: `heroStickerEn?: string; heroTitleEn?: string; heroLeadEn?: string; primaryCtaLabelEn?: string; secondaryCtaLabelEn?: string;`
- Add a `Page` type if one is used by the page loader (check `mi-az-a-slam-poetry.astro` / `egyesulet.astro` import). The `PAGE_BY_SLUG_QUERY` returns `title, lead, body, titleEn, leadEn, bodyEn, seo` — ensure the consuming pages read these (Task 12).

- [ ] **Step 3: Verify build still type-checks via the dev server**

Reload `http://localhost:4321/hirek` and `http://localhost:4321/slammerek` — pages still render (queries valid, no runtime error in `preview_logs`).

- [ ] **Step 4: Commit**

```bash
git add src/sanity/lib/queries.ts src/sanity/lib/api.ts
git commit -m "feat(i18n): fetch *_en fields in GROQ queries and extend types"
```

---

## Phase 3 — Layout, header, footer, language toggle, SEO

### Task 6: `BaseLayout` — lang attribute + hreflang

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Compute lang + alternate URLs in the frontmatter**

In `src/layouts/BaseLayout.astro` frontmatter, after the existing imports add:

```ts
import { getLangFromUrl, alternatePath, LOCALES, type Lang } from '../i18n';
```

After `const canonical = ...` add:

```ts
const lang: Lang = getLangFromUrl(Astro.url);
// hreflang alternatívák: ugyanaz az oldal minden nyelven (abszolút URL).
const hreflangs = LOCALES.map((l) => ({
  lang: l,
  href: new URL(alternatePath(Astro.url.pathname, l), Astro.site).href,
}));
```

- [ ] **Step 2: Use `lang` on `<html>` and add hreflang tags**

Change `<html lang="hu">` to `<html lang={lang}>`.

In `<head>`, after the `<link rel="canonical" ...>` line, add:

```astro
    {hreflangs.map((h) => <link rel="alternate" hreflang={h.lang} href={h.href} />)}
    <link rel="alternate" hreflang="x-default" href={hreflangs.find((h) => h.lang === 'hu')!.href} />
    <meta property="og:locale" content={lang === 'en' ? 'en_GB' : 'hu_HU'} />
```

Note: there is already a hardcoded `<meta property="og:locale" content="hu_HU" />` — remove that hardcoded line so the dynamic one above is the only og:locale.

- [ ] **Step 3: Pass `lang` to Header and Footer**

Change `<Header settings={settings} />` → `<Header settings={settings} lang={lang} />` and `<Footer settings={settings} />` → `<Footer settings={settings} lang={lang} />`.

- [ ] **Step 4: Verify**

Reload `/` and `/en` (after Task 11 the route exists; for now `/en` may 404 — that's expected until Phase 5). On `/`, view source: `<html lang="hu">` and two hreflang tags present. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(i18n): BaseLayout lang attribute + hreflang alternates"
```

---

### Task 7: `LangToggle` component

**Files:**
- Create: `src/components/LangToggle.astro`

- [ ] **Step 1: Create the component**

Create `src/components/LangToggle.astro`:

```astro
---
import { getLangFromUrl, alternatePath, type Lang } from '../i18n';
import { t } from '../i18n/ui';
const lang: Lang = getLangFromUrl(Astro.url);
const other: Lang = lang === 'hu' ? 'en' : 'hu';
const href = alternatePath(Astro.url.pathname, other);
const label = other === 'en' ? 'EN' : 'HU';
---
<a
  href={href}
  class="lang-toggle inline-flex h-8 items-center rounded-full border border-surface/25 px-3 text-xs font-semibold uppercase tracking-wide text-surface/80 transition hover:border-accent hover:text-accent"
  aria-label={t(lang, 'lang.switchTo')}
  title={t(lang, 'lang.switchTo')}
>
  {label}
</a>
```

- [ ] **Step 2: Verify (after Header wires it in Task 8)**

Deferred to Task 8 verification.

- [ ] **Step 3: Commit**

```bash
git add src/components/LangToggle.astro
git commit -m "feat(i18n): LangToggle component linking to the other-locale URL"
```

---

### Task 8: `Header` — translate strings, locale-aware links, render LangToggle

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Accept `lang`, import helpers, localize nav**

In `src/components/Header.astro` frontmatter:
- Add to imports: `import LangToggle from "./LangToggle.astro";`, `import { t } from "../i18n/ui";`, `import { localizedPath, type Lang } from "../i18n";`
- Change `interface Props { settings: SiteSettings; }` → `interface Props { settings: SiteSettings; lang: Lang; }`
- Change `const { settings } = Astro.props;` → `const { settings, lang } = Astro.props;`
- Replace the default `nav` array with translated labels + locale-aware hrefs:

```ts
const navItems = [
  { key: 'nav.whatIsSlam', href: '/mi-az-a-slam-poetry' },
  { key: 'nav.events', href: '/esemenyek' },
  { key: 'nav.slammers', href: '/slammerek' },
  { key: 'nav.news', href: '/hirek' },
  { key: 'nav.media', href: '/mediatar' },
  { key: 'nav.association', href: '/egyesulet' },
  { key: 'nav.contact', href: '/kapcsolat' },
];
```

- [ ] **Step 2: Use the translated nav in both menus + logo link**

- Logo link: `<a href="/" ...>` → `<a href={localizedPath('/', lang)} ...>`.
- Desktop nav `{nav.map(...)}` → iterate `navItems`, rendering `<a href={localizedPath(item.href, lang)}>{t(lang, item.key)}</a>`.
- Mobile dropdown nav `{nav.map(...)}` → same pattern with `localizedPath` + `t`.
- The mobile dropdown link-close script selector `a[href^="/"]` still works.

- [ ] **Step 3: Render LangToggle next to ThemeToggle**

In the right-side controls `<div class="flex items-center gap-3">`, add `<LangToggle />` immediately before `<ThemeToggle />`.

- [ ] **Step 4: Verify in preview**

Reload `/`. Header shows Hungarian nav + an `EN` toggle. Click `EN` → URL becomes `/en` (will 404 until Phase 5; that's fine). Use `preview_eval` to confirm the toggle href:

```js
document.querySelector('.lang-toggle')?.getAttribute('href') // → "/en"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat(i18n): translate header nav, locale-aware links, add LangToggle"
```

---

### Task 9: `Footer` — translate strings + locale-aware links

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Accept `lang`, import helpers**

In `src/components/Footer.astro`:
- Add imports: `import { t } from "../i18n/ui";`, `import { localizedPath, type Lang } from "../i18n";`
- Change Props to `{ settings: SiteSettings; lang: Lang }` and destructure `lang`.

- [ ] **Step 2: Replace hardcoded Hungarian strings with `t(lang, ...)`**

- `Impresszum` → `{t(lang, 'footer.impressum')}`
- `Kapcsolat` (heading) → `{t(lang, 'footer.contact')}`
- `Lépj kapcsolatba velünk →` → `{t(lang, 'footer.getInTouch')}`
- `Átláthatóság` → `{t(lang, 'footer.transparency')}`
- `Éves beszámolók ↗` → `{t(lang, 'footer.annualReports')} ↗`
- `Éves beszámolók (hamarosan)` → `{t(lang, 'footer.annualReportsSoon')}`
- The `/kapcsolat` link href → `localizedPath('/kapcsolat', lang)`.

- [ ] **Step 3: Verify**

Reload `/`. Footer renders identically in Hungarian (the `t('hu', ...)` values equal the originals). No visual change at HU.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat(i18n): translate footer strings and localize its links"
```

---

## Phase 4 — Wire remaining UI strings through `t()`

> Pattern for every component below: import `{ t }` from `../i18n/ui` (adjust depth) and `{ getLangFromUrl } from '../i18n'`; compute `const lang = getLangFromUrl(Astro.url)` in the frontmatter (Astro components have `Astro.url`); replace each hardcoded Hungarian string with `t(lang, 'key')` and ADD that key to BOTH `ui.hu` and `ui.en` in `src/i18n/ui.ts`. After each component, run `npx vitest run test/i18n-ui.test.ts` to confirm hu/en key parity stays green.

### Task 10: Translate shared UI components

**Files:**
- Modify: `src/components/PageHero.astro` (the `label`, `title`, `lead` come from page props — leave as props, but any literal strings → `t()`).
- Modify: `src/components/SectionHeader.astro`
- Modify: `src/components/MediaFan.tsx` (button labels: "Előző"/"Következő" aria-labels, "Lejátszás", "Bezárás") — this is a React island; pass `lang` as a prop from `mediatar` pages and import the dictionary, OR keep its few strings as props. Simplest: add a `labels` prop object passed from the page.
- Modify form components used across pages: `src/components/SlammerApplicationForm.astro`, `src/components/SlamClubForm.astro`, `src/components/SlammerEditRequest.astro`, `src/components/MonthlyContestButton.astro`, and the contact form on `kapcsolat.astro`.

- [ ] **Step 1: Inventory the literal strings**

Run a search to list Hungarian UI literals in these files:

Run: `npx vitest run` first to confirm green baseline, then grep each file for visible Hungarian text (labels, button text, placeholders, status messages).

- [ ] **Step 2: For each file, add keys + replace**

For each literal, add a namespaced key to `src/i18n/ui.ts` (`form.*`, `media.*`, `slammers.*`, etc.) with hu = the original text and en = the English translation, then replace the literal with `t(lang, 'key')`. Example for `SectionHeader.astro` (if it renders a literal): none expected (it takes `label`/`title` props) — verify and skip if so.

Example keys to add for forms (hu/en):
- `form.submit` = "Beküldés" / "Submit"
- `form.sending` = "Küldés…" / "Sending…"
- `form.thanks` = "Köszönjük! Átnézzük." / "Thank you! We’ll review it."
- `form.networkError` = "Hálózati hiba. Próbáld újra." / "Network error. Please try again."
- `form.name` = "Név" / "Name"
- `form.email` = "Email" / "Email"
- `form.optional` = "(opcionális)" / "(optional)"

(Add the specific keys each form actually needs — one per literal found in Step 1.)

- [ ] **Step 3: For `MediaFan.tsx`, pass labels from the page**

In `src/pages/mediatar/index.astro` (and the future `/en` variant), build a `labels` object using `t(lang, ...)` and pass it: `<MediaFan videos={videos} labels={labels} client:visible />`. In `MediaFan.tsx`, add `labels` to props and use `labels.prev`, `labels.next`, `labels.play`, `labels.close` instead of the hardcoded Hungarian, with sensible Hungarian defaults so existing behavior is unchanged when `labels` is omitted.

- [ ] **Step 4: Verify parity + preview**

Run: `npx vitest run test/i18n-ui.test.ts` → PASS (parity holds).
Reload `/` and `/slammerek` (HU) — all strings unchanged visually.

- [ ] **Step 5: Commit**

```bash
git add src/components src/i18n/ui.ts src/pages/mediatar/index.astro
git commit -m "feat(i18n): route shared component + form strings through t()"
```

---

## Phase 5 — English routes (pages)

### Task 11: Enable Astro i18n + shared page bodies

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Add i18n config**

In `astro.config.mjs`, inside `defineConfig({ ... })`, add:

```js
  i18n: {
    locales: ['hu', 'en'],
    defaultLocale: 'hu',
    routing: { prefixDefaultLocale: false },
  },
```

- [ ] **Step 2: Restart dev server**

Stop and start `npm run dev` (config change). Confirm `/` still loads.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(i18n): enable Astro i18n (hu default, /en prefix)"
```

---

### Task 12: English static pages

> Each `/en` page is a thin wrapper. Two clean patterns — use whichever fits the page:
> - **(a) Shared body component:** extract the existing page's body into `src/components/pages/<Name>.astro` that takes a `lang` prop; the HU route file and the EN route file both render it with the right `lang`.
> - **(b) Inline wrapper:** for short pages, copy the route file to `src/pages/en/<name>.astro` and set `lang='en'`, reading localized CMS via `localized(doc, 'field', lang)` and UI via `t(lang, ...)`.
> Prefer (a) to avoid duplication on non-trivial pages.

**Files (create):**
- `src/pages/en/index.astro`
- `src/pages/en/mi-az-a-slam-poetry.astro`
- `src/pages/en/egyesulet.astro`
- `src/pages/en/kapcsolat.astro`
- `src/pages/en/mediatar/index.astro`
- `src/pages/en/404.astro` (if a custom 404 exists at `src/pages/404.astro`)
**Files (modify):** the corresponding HU pages to extract shared bodies (pattern a) and to read `lang = getLangFromUrl(Astro.url)`, using `localized()` for CMS text and `t()` for UI.

- [ ] **Step 1: Refactor `mi-az-a-slam-poetry` to a shared, lang-aware body**

Open `src/pages/mi-az-a-slam-poetry.astro`. It loads a `page` doc and renders `lead` + `body`. Change it to:
- compute `const lang = getLangFromUrl(Astro.url)`
- title: `localized(page, 'title', lang) ?? 'Mi az a slam poetry?'`
- lead: `localized(page, 'lead', lang)`
- body: `localized(page, 'body', lang)` passed to `<RichText>`
Extract the JSX into `src/components/pages/WhatIsSlam.astro` taking `{ page, lang }` if it reduces duplication; otherwise keep inline and create the EN wrapper that imports the same component.

- [ ] **Step 2: Create `src/pages/en/mi-az-a-slam-poetry.astro`**

```astro
---
import WhatIsSlam from '../../components/pages/WhatIsSlam.astro';
import { getPageBySlug } from '../../sanity/lib/api'; // or the existing loader used by the HU page
import { sanityClient } from 'sanity:client';
const page = await getPageBySlug(sanityClient, 'mi-az-a-slam-poetry');
---
<WhatIsSlam page={page} lang="en" />
```

(Mirror the exact loader the HU page uses.)

- [ ] **Step 3: Repeat for `egyesulet`, `kapcsolat`, `mediatar`, `index`, `404`**

For each: make the HU page `lang`-aware (UI via `t(lang, ...)`, CMS via `localized(...)`), extract a shared body if non-trivial, and add the `src/pages/en/...` wrapper rendering with `lang="en"`.
- `index.astro`: hero strings come from `siteSettings.home` — use `localized(settings.home, 'heroTitle', lang)` etc. (the `*_en` fields from Task 4/5); CTA labels likewise; section headings via `t()`.
- `kapcsolat.astro`: socials list + contact email unchanged; labels via `t()`.
- `mediatar`: pass `labels` to `MediaFan` (Task 10 Step 3) computed with the page `lang`.

- [ ] **Step 4: Verify each EN page**

For each, reload `http://localhost:4321/en/<path>`:
- Page renders (no 404, no console error).
- UI chrome is English.
- CMS body shows English if `*_en` is filled, otherwise Hungarian (fallback) — confirm via a page whose `*_en` is empty (should show HU).

- [ ] **Step 5: Commit**

```bash
git add src/pages/en src/pages/index.astro src/pages/mi-az-a-slam-poetry.astro src/pages/egyesulet.astro src/pages/kapcsolat.astro src/pages/mediatar/index.astro src/components/pages
git commit -m "feat(i18n): English static pages (/en) with shared lang-aware bodies"
```

---

### Task 13: English dynamic pages (slammers, events, news)

**Files (create):**
- `src/pages/en/slammerek/index.astro`
- `src/pages/en/slammerek/[slug].astro`
- `src/pages/en/esemenyek/index.astro`
- `src/pages/en/esemenyek/[slug].astro`
- `src/pages/en/hirek/index.astro`
- `src/pages/en/hirek/[slug].astro`
**Files (modify):** the HU list + `[slug]` pages to be lang-aware (read `lang`, use `localized()` for `title`/`bio`/`description`/`excerpt`/`body`, `t()` for UI).

- [ ] **Step 1: Make HU `[slug]` pages lang-aware**

In `src/pages/slammerek/[slug].astro`:
- `const lang = getLangFromUrl(Astro.url)`
- name stays HU (names are language-neutral); bio: `const bio = localized(slammer, 'bio', lang)` passed to `<RichText value={bio} />`.
- `SlammerEditRequest` and section labels via `t()`.
Do the analogous change in `esemenyek/[slug].astro` (title/description via `localized`) and `hirek/[slug].astro` (title/excerpt/body via `localized`).

- [ ] **Step 2: Create the EN dynamic wrappers with their own `getStaticPaths`**

Example `src/pages/en/slammerek/[slug].astro`:

```astro
---
import SlammerProfile from '../../../components/pages/SlammerProfile.astro'; // extracted shared body
import { getSlammers, getSlammerBySlug } from '../../../sanity/lib/api';
import { sanityClient } from 'sanity:client';
export async function getStaticPaths() {
  const slammers = await getSlammers(sanityClient);
  return slammers.map((s) => ({ params: { slug: s.slug } }));
}
const { slug } = Astro.params;
const slammer = await getSlammerBySlug(sanityClient, slug!);
if (!slammer) return Astro.redirect('/en/slammerek');
---
<SlammerProfile slammer={slammer} lang="en" />
```

Extract the existing HU `[slug]` body into `src/components/pages/SlammerProfile.astro` taking `{ slammer, lang }`, and have the HU route render it with `lang="hu"`. Do the same for events and news (`EventDetail.astro`, `NewsPost.astro`).

- [ ] **Step 3: Create the EN list wrappers**

Example `src/pages/en/slammerek/index.astro` renders the same content as the HU list with `lang="en"` (extract a shared `SlammersIndex.astro` if needed, or pass `lang`). The internal links inside these pages MUST use `localizedPath(href, lang)` so EN navigation stays in `/en/`.

- [ ] **Step 4: Verify**

Reload `http://localhost:4321/en/slammerek`, click into a profile → URL stays under `/en/slammerek/<slug>`, bio shows EN if filled else HU. Same for `/en/esemenyek` and `/en/hirek`. Confirm internal links keep the `/en` prefix (`preview_eval` to sample an anchor href).

- [ ] **Step 5: Commit**

```bash
git add src/pages/en src/pages/slammerek src/pages/esemenyek src/pages/hirek src/components/pages
git commit -m "feat(i18n): English dynamic pages (slammers/events/news) with localized content"
```

---

## Phase 6 — English content for the two main static pages

### Task 14: Populate `page.*_en` for "Mi az a slam" and "Egyesület"

**Files:**
- Create (throwaway): `scripts/i18n-page-content.mjs` (delete after running)

- [ ] **Step 1: Read the current Hungarian page content**

Run a one-off read to get the HU `lead` + `body` for slugs `mi-az-a-slam-poetry` and `egyesulet`:

```bash
node --env-file=.env -e "const {createClient}=require('@sanity/client');const c=createClient({projectId:'8x0yi65e',dataset:'production',apiVersion:'2024-01-01',useCdn:false});c.fetch('*[_type==\"page\" && slug.current in [\"mi-az-a-slam-poetry\",\"egyesulet\"]]{ \"slug\": slug.current, title, lead, body }').then(x=>console.log(JSON.stringify(x,null,1)))"
```

- [ ] **Step 2: Write the English translations**

Translate the Hungarian `lead` and `body` (Portable Text) into English. Build the EN Portable Text blocks with fresh `_key` values (`Math.random().toString(36).slice(2,10)`), preserving paragraph/heading structure.

- [ ] **Step 3: Patch the docs with `titleEn`/`leadEn`/`bodyEn`**

Create `scripts/i18n-page-content.mjs` that, for each slug, patches `titleEn`, `leadEn`, and `bodyEn` with the English content. Use the write token. Run:

```bash
node --env-file=.env scripts/i18n-page-content.mjs
```

- [ ] **Step 4: Verify in preview**

Reload `http://localhost:4321/en/mi-az-a-slam-poetry` and `http://localhost:4321/en/egyesulet` — the body text is now English. The HU pages are unchanged.

- [ ] **Step 5: Delete the throwaway script + commit (no content in git; content lives in Sanity)**

```bash
rm scripts/i18n-page-content.mjs
# nothing to commit unless code changed; the EN content is stored in Sanity
```

---

## Phase 7 — Final verification

### Task 15: Full pass + tests + sitemap

- [ ] **Step 1: Run the whole test suite**

Run: `npx vitest run`
Expected: PASS (all previous tests + the new i18n tests).

- [ ] **Step 2: Preview matrix**

With `npm run dev`, verify in the browser preview:
- HU pages unchanged at root (`/`, `/slammerek`, `/hirek`, `/esemenyek`, `/mediatar`, `/egyesulet`, `/kapcsolat`, `/mi-az-a-slam-poetry`).
- EN equivalents at `/en/...` render with English chrome.
- LangToggle round-trips: from `/slammerek` → `EN` → `/en/slammerek` → `HU` → `/slammerek`.
- Fallback: an EN page whose CMS `*_en` is empty shows Hungarian text (not blank).
- `<head>` on an EN page has `hreflang="hu"`, `hreflang="en"`, `hreflang="x-default"`, and `<html lang="en">`.

- [ ] **Step 3: Confirm sitemap includes both locales**

Build is not required for dev; trust Astro i18n + `@astrojs/sitemap`. (On deploy, verify `/sitemap-index.xml` lists `/en/` URLs.)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test(i18n): full HU/EN verification pass"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Notes / risks
- **Deploy:** no new env vars for i18n. Astro i18n works on the Vercel adapter.
- **Editor onboarding:** tell editors the "(English)" fields are optional; empty = Hungarian shows on the EN site.
- **YAGNI:** no auto-detect/redirect, no third language, Studio stays Hungarian.
- **Biggest implementation risk:** page-body extraction into shared components (Tasks 12–13). Keep each shared body component focused; the HU and EN route files should be thin wrappers differing only by `lang`.
