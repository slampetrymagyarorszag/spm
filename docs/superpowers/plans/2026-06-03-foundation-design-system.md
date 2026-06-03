# Slam Poetry MO — 1. terv: Alap + design system + CMS-váz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Egy futó, stílusos Astro-oldalváz felépítése beágyazott Sanity Studióval, márka-design-tokenekkel, és közös Layout/Header/Footer kerettel, amelyre a következő tervek (tartalomtípusok, űrlapok, integrációk, főoldal, migráció) épülnek.

**Architecture:** Egyetlen Astro projekt statikus kimenettel. A `@sanity/astro` integráció behúzza a Sanity klienst (`sanity:client`) és a Studiót egy `/admin` route-on (hash router, statikus build). A design system Tailwind v4 CSS-first `@theme` tokenekkel készül; a tartalmi szövegrész világos, a hero/fejléc sötét. Az első tartalomtípus a `siteSettings` singleton (logó, menü, social, accent szín), amelyből a Header/Footer táplálkozik.

**Tech Stack:** Astro (statikus), Tailwind v4 (`@tailwindcss/vite`), `@sanity/astro` + `@astrojs/react`, Sanity Studio, Fontsource (Anton + Inter), TypeScript, Vitest (utility tesztekhez).

**Megjegyzés a tesztelésről:** Ez a terv túlnyomórészt projekt-scaffolding és UI-keret, ahol a hiteles verifikáció a **build sikere + a renderelt kimenet ellenőrzése** (a futó dev-szerver oldalának tartalma), nem a mesterséges unit teszt. Ahol valódi logika van (adatlekérő helper), ott Vitest teszt készül. A verifikációs lépések ennek megfelelően konkrét parancsokat és elvárt kimenetet adnak.

**Provizórikus márka-értékek (a logó átadásakor véglegesítendő):**
- Display font: **Anton**, törzs: **Inter**
- `--color-ink: #111114`, `--color-surface: #ffffff`, `--color-muted: #5a5560`
- `--color-accent: #b13bd6` (lila/magenta); esemény-paletta: piros `#e11d2a`, sárga `#f5c518`, türkiz `#18b3b0`

---

## Fájlszerkezet (ebben a tervben létrejövő/érintett fájlok)

```
spm/
  astro.config.mjs            # Astro + Sanity + React + Tailwind konfiguráció
  package.json
  tsconfig.json
  .env.example                # Sanity projectId/dataset (példányminta)
  .gitignore
  README.md
  sanity.config.ts            # Sanity Studio konfiguráció (séma, struktúra)
  src/
    styles/global.css         # Tailwind import + @theme design tokenek + alap stílusok
    sanity/
      schemaTypes/
        index.ts              # séma-export
        siteSettings.ts       # singleton dokumentumtípus
      lib/
        queries.ts            # GROQ lekérdezések (siteSettings)
        api.ts                # típusos helperek (getSiteSettings)
      structure.ts            # Studio desk-struktúra (siteSettings singleton)
    components/
      Header.astro
      Footer.astro
    layouts/
      BaseLayout.astro        # <head>, fontok, globális stílus, Header/Footer slot
    pages/
      index.astro             # ideiglenes főoldal (a keretet demonstrálja)
  test/
    api.test.ts               # getSiteSettings helper egységteszt (Vitest)
```

---

### Task 1: Astro projekt váz + Git alap

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro` (Astro generálja)
- Modify: `.gitignore`

- [ ] **Step 1: Astro projekt inicializálása a meglévő mappába**

A projekt gyökerében (`spm/`) fut. Üres/minimal sablon, TypeScript strict, függőségek telepítése.

Run:
```bash
npm create astro@latest . -- --template minimal --typescript strict --install --no-git --skip-houston
```
Expected: létrejön `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`; `node_modules/` települ. (Ha a mappa nem teljesen üres a `docs/` miatt, válaszd a „folytatás a meglévő fájlokkal" opciót.)

- [ ] **Step 2: `.gitignore` kiegészítése**

Írd a `.gitignore` végéhez (ha nincs benne):
```
node_modules
dist
.env
.env.*
!.env.example
.astro
.superpowers/
.DS_Store
```

- [ ] **Step 3: Dev-szerver füstteszt**

Run:
```bash
npm run build
```
Expected: `npm run build` hiba nélkül lefut (`Complete!`), létrejön a `dist/`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project"
```

---

### Task 2: Tailwind v4 + design tokenek (márka)

**Files:**
- Modify: `astro.config.mjs`
- Create: `src/styles/global.css`

- [ ] **Step 1: Tailwind hozzáadása**

Run:
```bash
npx astro add tailwind --yes
```
Expected: telepíti a `@tailwindcss/vite` plugint és bejegyzi az `astro.config.mjs` `vite.plugins` közé.

- [ ] **Step 2: Globális CSS + design tokenek**

Create `src/styles/global.css`:
```css
@import "tailwindcss";
@import "@fontsource/anton/400.css";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";

@theme {
  --font-display: "Anton", system-ui, sans-serif;
  --font-sans: "Inter", system-ui, sans-serif;

  --color-ink: #111114;
  --color-surface: #ffffff;
  --color-muted: #5a5560;

  --color-accent: #b13bd6;
  --color-event-red: #e11d2a;
  --color-event-yellow: #f5c518;
  --color-event-teal: #18b3b0;
}

:root {
  /* Felülírható accent: az esemény-oldalak ezt állítják majd */
  --accent: var(--color-accent);
}

html {
  font-family: var(--font-sans);
  color: var(--color-ink);
  background: var(--color-surface);
}

.font-display {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
```

- [ ] **Step 3: Fontok telepítése**

Run:
```bash
npm install @fontsource/anton @fontsource/inter
```
Expected: mindkét csomag bekerül a `package.json` függőségei közé.

- [ ] **Step 4: Build verifikáció (a tokenek a kimenetben)**

A `src/styles/global.css`-t ideiglenesen importáld a `src/pages/index.astro` frontmatterébe (`import "../styles/global.css"`), majd:
```bash
npm run build
```
Expected: build sikeres; a `dist/` valamelyik CSS fájljában megjelenik a `--color-accent:#b13bd6` (ellenőrizd: keress rá a `dist/_astro/*.css`-ben). 

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind v4 and brand design tokens"
```

---

### Task 3: Sanity integráció hozzáadása

**Files:**
- Modify: `astro.config.mjs`
- Create: `.env.example`

- [ ] **Step 1: Sanity + React integráció**

Run:
```bash
npx astro add @sanity/astro @astrojs/react --yes
```
Expected: telepíti a `@sanity/astro`, `@astrojs/react`, `sanity`, `react`, `react-dom` csomagokat és bejegyzi az integrációkat.

- [ ] **Step 2: Sanity projekt létrehozása (projectId beszerzése)**

Run:
```bash
npx sanity@latest init --env
```
Követelmény: bejelentkezés Sanity-fiókba, új projekt neve „Slam Poetry MO", dataset `production`. A parancs `.env`-be írja a `PUBLIC_SANITY_PROJECT_ID` és `PUBLIC_SANITY_DATASET` értékeket.
Expected: létrejön a Sanity projekt; `.env` tartalmazza a projectId-t.

> Ha a CLI más env-kulcsneveket ír (pl. `SANITY_PROJECT_ID`), igazítsd a `astro.config.mjs`-ben a hivatkozást ezekhez.

- [ ] **Step 3: `.env.example` létrehozása**

Create `.env.example`:
```
PUBLIC_SANITY_PROJECT_ID=your_project_id
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_VISUAL_EDITING_ENABLED=false
```

- [ ] **Step 4: `astro.config.mjs` Sanity-konfiguráció**

Szerkeszd az `astro.config.mjs`-t, hogy a Sanity integráció a `/admin` Studiót és a statikus hash-routert használja:
```javascript
import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.PUBLIC_SANITY_DATASET,
      useCdn: false,
      studioBasePath: '/admin',
      studioRouterHistory: 'hash',
    }),
    react(),
  ],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 5: Build verifikáció**

Run:
```bash
npm run build
```
Expected: build sikeres (a Studio route is generálódik).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Sanity + React integration and config"
```

---

### Task 4: `siteSettings` séma + Studio struktúra

**Files:**
- Create: `src/sanity/schemaTypes/siteSettings.ts`, `src/sanity/schemaTypes/index.ts`, `src/sanity/structure.ts`, `sanity.config.ts`

- [ ] **Step 1: `siteSettings` dokumentumtípus**

Create `src/sanity/schemaTypes/siteSettings.ts`:
```ts
import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Oldal beállítások',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Oldal címe', type: 'string', initialValue: 'Slam Poetry Magyarország' }),
    defineField({ name: 'logo', title: 'Logó', type: 'image' }),
    defineField({ name: 'accentColor', title: 'Alap accent szín (hex)', type: 'string', initialValue: '#b13bd6' }),
    defineField({
      name: 'nav',
      title: 'Főmenü',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', title: 'Felirat', type: 'string' }),
          defineField({ name: 'href', title: 'Link', type: 'string' }),
        ],
      }],
    }),
    defineField({
      name: 'social',
      title: 'Közösségi linkek',
      type: 'object',
      fields: [
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
      ],
    }),
    defineField({ name: 'contactEmail', title: 'Kapcsolati email', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Oldal beállítások' }) },
});
```

- [ ] **Step 2: Séma-index**

Create `src/sanity/schemaTypes/index.ts`:
```ts
import { siteSettings } from './siteSettings';

export const schemaTypes = [siteSettings];
```

- [ ] **Step 3: Studio struktúra (singleton)**

Create `src/sanity/structure.ts`:
```ts
import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Tartalom')
    .items([
      S.listItem()
        .title('Oldal beállítások')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]);
```

- [ ] **Step 4: `sanity.config.ts`**

Create `sanity.config.ts` a projekt gyökerében:
```ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';

export default defineConfig({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.PUBLIC_SANITY_DATASET!,
  plugins: [structureTool({ structure })],
  schema: { types: schemaTypes },
});
```

- [ ] **Step 5: Studio betöltés verifikáció**

Run:
```bash
npm run dev
```
Majd böngészőben (vagy `curl -s http://localhost:4321/admin` — a hash-router miatt a HTML váz töltődik): a `/admin` route betölti a Sanity Studiót, bal oldalon „Oldal beállítások" elem.
Expected: a Studio megnyílik, az „Oldal beállítások" szerkeszthető; ments el egy `title` értéket.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add siteSettings schema and Studio structure"
```

---

### Task 5: `getSiteSettings` adatlekérő helper (+ teszt)

**Files:**
- Create: `src/sanity/lib/queries.ts`, `src/sanity/lib/api.ts`, `test/api.test.ts`
- Modify: `package.json` (Vitest script)

- [ ] **Step 1: Vitest telepítése**

Run:
```bash
npm install -D vitest
```
Majd add a `package.json` `scripts`-hez: `"test": "vitest run"`.

- [ ] **Step 2: A teszt megírása (előbb a teszt)**

Create `test/api.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { getSiteSettings } from '../src/sanity/lib/api';

describe('getSiteSettings', () => {
  it('lekéri a siteSettings dokumentumot a kliensből', async () => {
    const fakeClient = { fetch: vi.fn().mockResolvedValue({ title: 'Slam Poetry MO', accentColor: '#b13bd6' }) };
    const result = await getSiteSettings(fakeClient as any);
    expect(fakeClient.fetch).toHaveBeenCalledOnce();
    expect(result.title).toBe('Slam Poetry MO');
    expect(result.accentColor).toBe('#b13bd6');
  });
});
```

- [ ] **Step 3: Futtasd, bukjon el**

Run:
```bash
npm test
```
Expected: FAIL — `getSiteSettings` / `../src/sanity/lib/api` nem létezik.

- [ ] **Step 4: GROQ lekérdezés**

Create `src/sanity/lib/queries.ts`:
```ts
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  title, accentColor, contactEmail,
  "logoUrl": logo.asset->url,
  nav[]{ label, href },
  social
}`;
```

- [ ] **Step 5: Helper implementáció (minimális)**

Create `src/sanity/lib/api.ts`:
```ts
import { SITE_SETTINGS_QUERY } from './queries';

export type SiteSettings = {
  title: string;
  accentColor?: string;
  contactEmail?: string;
  logoUrl?: string;
  nav?: { label: string; href: string }[];
  social?: { facebook?: string; youtube?: string; instagram?: string };
};

type Fetcher = { fetch: (query: string) => Promise<any> };

export async function getSiteSettings(client: Fetcher): Promise<SiteSettings> {
  return (await client.fetch(SITE_SETTINGS_QUERY)) as SiteSettings;
}
```

- [ ] **Step 6: Futtasd, menjen át**

Run:
```bash
npm test
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add getSiteSettings data helper with test"
```

---

### Task 6: BaseLayout (head, fontok, globális stílus)

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: BaseLayout megírása**

Create `src/layouts/BaseLayout.astro`:
```astro
---
import "../styles/global.css";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import { getSiteSettings } from "../sanity/lib/api";
import { sanityClient } from "sanity:client";

interface Props { title?: string; description?: string; }
const { title, description } = Astro.props;
const settings = await getSiteSettings(sanityClient);
const pageTitle = title ? `${title} — ${settings.title}` : settings.title;
---
<!doctype html>
<html lang="hu">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{pageTitle}</title>
    {description && <meta name="description" content={description} />}
  </head>
  <body class="min-h-screen flex flex-col">
    <Header settings={settings} />
    <main class="flex-1"><slot /></main>
    <Footer settings={settings} />
  </body>
</html>
```

- [ ] **Step 2: Verifikáció a Header/Footer megírása után történik (Task 7–8).**

Most csak commit:
```bash
git add -A
git commit -m "feat: add BaseLayout shell"
```

---

### Task 7: Header (sötét, menü a siteSettings-ből)

**Files:**
- Create: `src/components/Header.astro`

- [ ] **Step 1: Header megírása**

Create `src/components/Header.astro`:
```astro
---
import type { SiteSettings } from "../sanity/lib/api";
interface Props { settings: SiteSettings; }
const { settings } = Astro.props;
const nav = settings.nav?.length ? settings.nav : [
  { label: "Mi az a slam?", href: "/mi-az-a-slam-poetry" },
  { label: "Események", href: "/esemenyek" },
  { label: "Slammerek", href: "/slammerek" },
  { label: "Hírek", href: "/hirek" },
  { label: "Médiatár", href: "/mediatar" },
  { label: "Egyesület", href: "/egyesulet" },
  { label: "Kapcsolat", href: "/kapcsolat" },
];
---
<header class="sticky top-0 z-50 bg-ink text-surface">
  <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
    <a href="/" class="font-display text-2xl">
      {settings.logoUrl
        ? <img src={settings.logoUrl} alt={settings.title} class="h-9 w-auto" />
        : settings.title}
    </a>
    <ul class="hidden gap-5 md:flex">
      {nav.map((item) => (
        <li><a href={item.href} class="text-sm uppercase tracking-wide hover:text-accent">{item.label}</a></li>
      ))}
    </ul>
  </nav>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add dark sticky Header with nav"
```

---

### Task 8: Footer (social + kapcsolat)

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Footer megírása**

Create `src/components/Footer.astro`:
```astro
---
import type { SiteSettings } from "../sanity/lib/api";
interface Props { settings: SiteSettings; }
const { settings } = Astro.props;
const s = settings.social ?? {};
const year = new Date().getFullYear();
---
<footer class="bg-ink text-surface">
  <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
    <p class="font-display text-xl">{settings.title}</p>
    <ul class="flex gap-4 text-sm">
      {s.facebook && <li><a href={s.facebook} class="hover:text-accent">Facebook</a></li>}
      {s.youtube && <li><a href={s.youtube} class="hover:text-accent">YouTube</a></li>}
      {s.instagram && <li><a href={s.instagram} class="hover:text-accent">Instagram</a></li>}
      {settings.contactEmail && <li><a href={`mailto:${settings.contactEmail}`} class="hover:text-accent">{settings.contactEmail}</a></li>}
    </ul>
    <p class="text-xs text-muted">© {year}</p>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Footer with social and contact"
```

---

### Task 9: Ideiglenes főoldal + teljes keret-verifikáció

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Index a BaseLayout-tal**

Replace `src/pages/index.astro`:
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout>
  <section class="bg-ink text-surface">
    <div class="mx-auto max-w-6xl px-4 py-24">
      <h1 class="font-display text-5xl md:text-7xl">Slam Poetry Magyarország</h1>
      <p class="mt-4 max-w-xl text-lg text-surface/80">Hamarosan: a magyar slam poetry színtér élő központja.</p>
    </div>
  </section>
  <section class="mx-auto max-w-6xl px-4 py-16">
    <p class="text-muted">Tartalmi szekciók helye (világos háttér).</p>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Dev-szerver render-verifikáció**

Run (háttérben indítsd a dev-szervert, majd kérd le a főoldalt):
```bash
npm run dev
```
Külön parancsban:
```bash
curl -s http://localhost:4321/ | grep -c "Slam Poetry Magyarország"
```
Expected: legalább `1` találat; a HTML tartalmazza a `<header>` és `<footer>` elemeket, a fő címet és a navigációt.

- [ ] **Step 3: Build-verifikáció**

Run:
```bash
npm run build
```
Expected: build sikeres, `dist/index.html` tartalmazza a címet és a menüt.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire homepage shell with BaseLayout"
```

---

### Task 10: README + környezeti dokumentáció

**Files:**
- Create/Modify: `README.md`

- [ ] **Step 1: README megírása**

Create `README.md`:
```markdown
# Slam Poetry Magyarország — weboldal

Astro + Sanity (beágyazott Studio a `/admin` route-on) + Tailwind v4.

## Fejlesztés
1. `npm install`
2. Másold a `.env.example`-t `.env`-re, töltsd ki a Sanity projectId-t.
3. `npm run dev` → oldal: http://localhost:4321 , Studio: http://localhost:4321/admin
4. `npm test` — egységtesztek (Vitest)
5. `npm run build` — statikus build a `dist/`-be

## Felépítés
- `src/sanity/` — séma, struktúra, lekérdezések, adat-helperek
- `src/layouts/`, `src/components/` — UI keret
- `src/styles/global.css` — design tokenek (@theme)

A részletes terv: `docs/superpowers/specs/2026-06-03-slam-poetry-website-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: add project README"
```

---

## Self-Review (kész)

- **Spec-lefedettség (ehhez a fázishoz):** Astro+Sanity alap ✓ (Task 1,3), design tokenek/brand alap ✓ (Task 2), `siteSettings` séma ✓ (Task 4), adat-helper ✓ (Task 5), Layout/Header/Footer ✓ (Task 6–8), sötét hero + világos tartalom elv ✓ (Task 9). A teljes brand-asset készlet (ikonok, favicon, OG, textúrák) és a többi tartalomtípus **külön, későbbi tervekben** készül — ez szándékos fázishatár.
- **Placeholder-ellenőrzés:** nincs „TBD/TODO"; minden lépés konkrét parancsot/kódot ad. A provizórikus színek/fontok explicit, működő értékek (a logó átadásakor véglegesítendők).
- **Típus-konzisztencia:** a `SiteSettings` típus (Task 5) egységesen használt a BaseLayout/Header/Footer propokban (Task 6–8); a `getSiteSettings(client)` szignatúra végig egyezik.

## Következő tervek (külön fájlokban, ennek befejezése után)

2. Tartalomtípusok (hírek, események + jelentkezés-mező, slammerek, médiatár, statikus oldalak, kapcsolat) — séma + lista/részlet oldalak.
3. Űrlap-backend (serverless + Resend email) + országos bajnokság CTA.
4. Külső integrációk (YouTube Data API szinkron; FB esemény-link beágyazás; FB album-link galéria).
5. Főoldal összeállítása.
6. Tartalom-migráció (Firecrawl → Sanity import).
7. Polish + deploy (SEO/OG, sitemap, a11y, teljesítmény, hosting + webhook).
