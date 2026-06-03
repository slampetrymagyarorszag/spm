# Slam Poetry Magyarország — weboldal

Astro + Sanity (beágyazott Studio a `/admin` route-on) + Tailwind v4.

## Fejlesztés

1. `npm install`
2. Másold a `.env.example`-t `.env`-re, töltsd ki a Sanity projectId-t/datasetet.
3. `npm run dev` → oldal: http://localhost:4321 , Studio: http://localhost:4321/admin
4. `npm test` — egységtesztek (Vitest)
5. `npm run build` — statikus build a `dist/`-be

## Felépítés

- `src/sanity/` — séma (`schemaTypes/`), Studio-struktúra (`structure.ts`), lekérdezések és adat-helperek (`lib/`)
- `src/layouts/`, `src/components/` — UI keret (BaseLayout, Header, Footer)
- `src/styles/global.css` — design tokenek (Tailwind v4 `@theme`)
- `sanity.config.ts` — a beágyazott Sanity Studio konfigurációja

## Dokumentáció

- Spec: `docs/superpowers/specs/2026-06-03-slam-poetry-website-design.md`
- Implementációs tervek: `docs/superpowers/plans/`
