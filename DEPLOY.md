# Deploy — Slam Poetry Magyarország (Vercel)

A projekt deploy-kész: Astro statikus + `@astrojs/vercel` adapter (az `/api/*` végpontok
serverless függvények). A buildet a Vercel (Linux) gond nélkül futtatja; a Windows-specifikus
`@astrojs/vercel` patch a `postinstall` (patch-package) miatt ott is automatikusan alkalmazódik.

## 1) Első éles deploy — Vercel CLI (nem kell GitHub)

A SAJÁT termináldban, a projekt mappájában:

```bash
npx vercel login        # böngészős bejelentkezés (Google/GitHub/email) — hozz létre fiókot, ha még nincs
npx vercel              # első deploy: kérdésekre Enter (új projekt, alap beállítások) -> Preview URL
npx vercel --prod       # éles (production) deploy -> a végleges URL
```

Az első `vercel` futás létrehozza a projektet a fiókodban, és ad egy URL-t.

## 2) Környezeti változók a Vercelen

A változókat a **Vercel dashboard → a projekt → Settings → Environment Variables** alatt vedd fel
(Production környezetre), VAGY CLI-ből (`npx vercel env add NEV production`). Kell:

| Név | Érték |
|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | `8x0yi65e` |
| `PUBLIC_SANITY_DATASET` | `production` |
| `PUBLIC_SITE_URL` | a végleges nyilvános URL (pl. `https://slampoetry.hu`). Ez adja a canonical/OG/sitemap abszolút linkeket. Ha nincs megadva, az alap `https://slampoetry.hu`. Vercel preview-domainen állítsd a preview URL-re. |
| `YOUTUBE_API_KEY` | a YouTube Data API kulcsod |
| `YOUTUBE_CHANNEL_ID` | `UCg2q-EVjQML15iQNK3L4B0Q` |
| `CONTACT_EMAIL` | `contest@slampoetry.hu` (opcionális, ez az alap) |
| `MAIL_FROM` | `Slam Poetry <no-reply@slampoetry.hu>` (a Resend-nél hitelesített domain) |
| `RESEND_API_KEY` | **később**, amikor megvan (a kapcsolat/jelentkezés űrlapokhoz; az esemény-tipp NEM ezt használja) |
| `SANITY_FORM_TOKEN` | az esemény-tipp űrlaphoz: egy **külön, írásra jogosult** Sanity token. A beküldés ezzel hoz létre „Beküldött esemény" dokumentumot a Studióban. |

> NE tedd fel a `SANITY_WRITE_TOKEN`-t — az csak a migrációs szkripthez kellett, futásidőben nem.
> A `SANITY_FORM_TOKEN` ettől KÜLÖN token: hozz létre a Sanity → API → Tokens alatt egy új,
> Editor jogú tokent kifejezetten az űrlaphoz, és csak EZT tedd a Vercelre.

A változók felvétele/módosítása után **újra kell deployolni** (`npx vercel --prod`), hogy érvénybe lépjenek.

## 3) Sanity CORS — a production domainre

A beágyazott Studio (`/admin`) és az adatlekérés miatt add hozzá a deploy-domaint a Sanity CORS-hoz:
**sanity.io/manage → 8x0yi65e → API → CORS origins → Add** → a Vercel-URL (pl.
`https://slampoetry.vercel.app`, majd a saját domain is) → **Allow credentials: BE**.

## 4) Saját domain (opcionális)

Vercel dashboard → a projekt → Settings → Domains → add hozzá a `slampoetry.hu`-t, és állítsd be a
DNS-t a Vercel utasítása szerint.

## 5) „Mindig friss" YouTube (ütemezett újraépítés)

A médiatár build-időben húzza a YouTube-videókat, ezért időnként újra kell buildelni:
- Vercel dashboard → Settings → **Deploy Hooks** → hozz létre egy hookot (URL).
- Ütemezd (pl. Vercel Cron, GitHub Action, vagy bármilyen cron, ami naponta megüti a hook-URL-t).

## Megjegyzés a jövőre (auto-deploy)
Ha később GitHubra teszed a kódot és a Vercelt rákapcsolod a repóra, minden push automatikusan
deployol — akkor a CLI már nem kell.
