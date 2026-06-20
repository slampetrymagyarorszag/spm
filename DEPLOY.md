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
| `FB_PAGE_ACCESS_TOKEN` | **opcionális** — a Facebook hír-importhoz (Studio → „Facebook hír import”). Hosszú élettartamú **Page access token** a Slam Poetry Magyarország oldalhoz (Facebook fejlesztői app, `pages_read_engagement`). Token nélkül az import nem működik, de minden más igen. |
| `FB_PAGE_ID` | **opcionális** — a Slam Poetry Magyarország Facebook-oldal numerikus azonosítója (a hír-import poszt-feloldásához). |

> NE tedd fel a `SANITY_WRITE_TOKEN`-t — az csak a migrációs szkripthez kellett, futásidőben nem.
> A `SANITY_FORM_TOKEN` ettől KÜLÖN token: hozz létre a Sanity → API → Tokens alatt egy új,
> Editor jogú tokent kifejezetten az űrlaphoz, és csak EZT tedd a Vercelre.

A változók felvétele/módosítása után **újra kell deployolni** (`npx vercel --prod`), hogy érvénybe lépjenek.

## 3) Sanity CORS — a production domainre

A beágyazott Studio (`/admin`) és az adatlekérés miatt add hozzá a deploy-domaint a Sanity CORS-hoz:
**sanity.io/manage → 8x0yi65e → API → CORS origins → Add** → a Vercel-URL (pl.
`https://slampoetry.vercel.app`, majd a saját domain is) → **Allow credentials: BE**.

## 4) A `slampoetry.hu` domain rákötése (DNS) — névszerver-csere NÉLKÜL

**A helyzet röviden.** Három külön dolog:
- **Domain-regisztráció**: a **Microware**-nél, Prekopcsák Zoltán nevén (2028-ig fizetve) — ezzel most nincs teendő.
- **DNS-rekordok + tárhely + email**: a **megacp**-nél (`ns1/2/3.megacp.com` névszerverek) — **ide van hozzáférésed** (megacp login + cPanel + webmail).
- A regisztrátor csak a névszerverekre mutat; a tényleges rekordokat a **megacp-nél** szerkesztjük.

➡️ **Ezért NEM kell névszervert cserélni, és Zoltánt/Microware-t sem kell bevonni.** A DNS-t a megacp-nél állítjuk át, a beérkező email a helyén marad.

### Lépések (ajánlott út)

**a) Vercel:** Project → Settings → Domains → **Add `slampoetry.hu`** (és `www`). A Vercel kiírja a pontos értékeket — jellemzően az alábbiak.

**b) Resend:** Domains → **Add `slampoetry.hu`** → kiír SPF / DKIM (és opcionális DMARC) rekordokat.

**c) megacp / cPanel → Zone Editor** (ha van „DNS / Zone Editor" menü, te is megteheted; ha nincs, lásd a lenti ticketet a megacp supporthoz). Állítsd be:

| Típus | Név (host) | Érték | Megjegyzés |
|---|---|---|---|
| **A** | `@` (slampoetry.hu) | `76.76.21.21` | a régi tárhely-IP **helyett** (pontos értéket a Vercel adja) |
| **CNAME** | `www` | `cname.vercel-dns.com` | a Vercel adja |
| **MX** | `@` | `*.megacp.com` (meglévő) | **NE változtasd** — az email marad a megacp-nél |
| **TXT (SPF)** | `@` | a meglévő SPF-et **kiegészíted** a Resend `include`-jával | egy domainen **csak egy** SPF TXT lehet |
| **CNAME/TXT (DKIM)** | a Resend adja (pl. `resend._domainkey`) | a Resend adja | a Resend domain-oldaláról másold |
| **TXT (DMARC, opc.)** | `_dmarc` | a Resend ajánlása | opcionális |

**d) Ellenőrzés:** `nslookup slampoetry.hu` → Vercel IP; Vercel Domains → **Valid**; Resend Domains → **Verified**; az oldal betölt a `https://slampoetry.hu`-n; egy kapcsolat-űrlap beküldése emailt kézbesít.

### Fallback (CSAK ha a megacp nem enged DNS-t szerkeszteni)
Zoltán átírja a névszervereket a Vercelére → a DNS a Vercelhez kerül. **Ekkor a megacp MX-eket (beérkező email) ÉS a Resend rekordokat újra fel kell venni a Vercel DNS-ben** (különben eláll a levelezés). Több lépés, nagyobb kockázat — csak végszükség esetén.

---

### Beilleszthető megacp support ticket (ha nem te szerkeszted a DNS-t)

> **Tárgy:** slampoetry.hu — DNS-rekord módosítás (weboldal Vercelre, email marad)
>
> Tisztelt Ügyfélszolgálat!
>
> A `slampoetry.hu` domainhez kérnék DNS-módosítást. A weboldalt egy új szolgáltatóhoz (Vercel) költöztetjük, de **a domain és a teljes levelezés (MX) maradjon változatlanul Önöknél**. Kérem, a DNS-zónában:
>
> 1. A gyökér **A rekordot** (`slampoetry.hu`) állítsák át a Vercel címére: **`76.76.21.21`**.
> 2. A **`www`** allegyen **CNAME**: **`cname.vercel-dns.com`**.
> 3. Az **MX rekordokat NE módosítsák** — a beérkező email maradjon a jelenlegi (`*.megacp.com`) szervereken.
> 4. Vegyenek fel néhány **kiegészítő rekordot a kimenő emailhez (Resend)** — ezeket külön emailben/üzenetben küldöm (SPF-kiegészítés, DKIM, DMARC). Az **SPF-nél a meglévő rekordot kérem kiegészíteni**, ne másodikat létrehozni.
>
> Ha bármi pontosítás kell, kérem jelezzék. Köszönöm a segítséget!
>
> Üdvözlettel,
> Mészáros Péter

## 5) „Mindig friss" YouTube (ütemezett újraépítés)

A médiatár build-időben húzza a YouTube-videókat, ezért időnként újra kell buildelni:
- Vercel dashboard → Settings → **Deploy Hooks** → hozz létre egy hookot (URL).
- Ütemezd (pl. Vercel Cron, GitHub Action, vagy bármilyen cron, ami naponta megüti a hook-URL-t).

## Megjegyzés a jövőre (auto-deploy)
Ha később GitHubra teszed a kódot és a Vercelt rákapcsolod a repóra, minden push automatikusan
deployol — akkor a CLI már nem kell.
