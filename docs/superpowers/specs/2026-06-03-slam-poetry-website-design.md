# Slam Poetry Magyarország — új weboldal (terv/spec)

## Context

A jelenlegi oldal (https://slampoetry.hu/) elavult: több helyen „fejlesztés alatt" állapotú, a
tartalmak (események, slammerek, média) régiek, és nincs kényelmes mód a frissítésükre. A cél egy
**teljesen új, modern, egyedi dizájnú közösségi portál**, amely a magyar slam poetry színtér élő
központja: naprakész hírek és események, kereshető slammer-adatbázis, médiatár, valamint a műfajt
bemutató és az egyesületet/kapcsolatot tartalmazó oldalak. A tartalmat **nem-technikai szerkesztők**
frissítik egy barátságos admin felületen keresztül. A vizuális nyelvet a meglévő brand (logó,
event coverek, social posztok) adja: sötét, drámai, energikus, erős tipográfiával.

A munka zöldmezős — a projekt mappa üres.

## Cél / siker-kritériumok

- A szerkesztők kódhoz nyúlás nélkül tudnak hírt/eseményt/slammert/médiát felvenni és szerkeszteni.
- Gyors, mobilbarát, akadálymentes (a11y) látogatói oldal, a brand vizuális világával.
- Kereshető/szűrhető slammer- és esemény-listák.
- Olcsó üzemeltetés (ingyenes/alacsony tier hosting + CMS).

## Hatókör (szekciók / információs architektúra)

1. **Főoldal** — hero (közelgő kiemelt esemény), legközelebbi események, friss hírek, kiemelt
   slammerek, médiatár-kiemelő, CTA az egyesülethez/közösséghez.
2. **Mi az a slam poetry?** — ismertető/onboarding oldal: mi a műfaj, hogyan zajlik egy verseny,
   szabályok, történet (2006–), beágyazott példavideók.
3. **Események** — lista (közelgő / korábbi szűrő), esemény-részlet oldal: dátum, helyszín
   (térkép/cím), leírás, fellépők, jegylink, borítókép.
4. **Slammerek** — kereshető/szűrhető rács; profil-oldal: fotó, bio, videók, eredmények/díjak,
   social linkek, kapcsolódó események.
5. **Hírek / blog** — lista + cikk-oldal (gazdag szöveg, képek, kategóriák/címkék).
6. **Médiatár** — videó- és képgaléria (YouTube-beágyazás), szűrés esemény/év szerint.
7. **Egyesület** — bemutatkozás, szabályzat, dokumentumok/letöltések.
8. **Kapcsolat** — elérhetőségek, kapcsolati űrlap, social linkek.
9. **Jelentkezési űrlapok** — eseményhez kapcsolható regisztráció (lásd lent), valamint a
   szezonális országos bajnokság-jelentkezés.

## Megközelítés (ajánlott architektúra)

**Headless CMS + statikus/edge frontend.** A szerkesztők egy hostolt admin felületen dolgoznak; a
látogatói oldal egy gyors, egyedi dizájnú frontend, amely a CMS tartalmából épül, és a publikáláskor
webhookkal frissül.

### Tech stack

- **Frontend:** **Astro** — tartalom-központú, minimális JS, „islands" a kevés interaktív elemhez
  (slammer-kereső/szűrő, esemény-szűrő, galéria-lightbox). Tökéletes egy főként olvasásra szánt,
  SEO-fontos közösségi oldalhoz.
- **CMS:** **Sanity** (hostolt, kényelmes Studio-szerkesztő nem-technikaiaknak, ingyenes tier bőven
  elég ehhez a mérethez). Tartalom-séma kódban verziózva, de a szerkesztés webes felületen.
  - *Alternatíva, ha self-host preferált később:* Payload CMS. A spec Sanity-re épül.
- **Hosting/deploy:** **Vercel** vagy **Netlify** ingyenes tier; Sanity-webhook → rebuild a
  publikáláskor (vagy Astro SSR/ISR az event-listákhoz, ha valós idejűbb kell).
- **Űrlap-/email-backend:** **serverless függvény** (Vercel/Netlify) a jelentkezések fogadására +
  email-küldés **Resend** (ingyenes tier) vagy SMTP használatával a `contest@slampoetry.hu` címre.
- **Képkezelés:** Sanity asset pipeline (automatikus reszponzív képek, CDN).
- **Analytics:** Plausible vagy Vercel Analytics (könnyű, GDPR-barát) — opcionális.

### CMS tartalom-séma (Sanity dokumentumtípusok)

- `event` — cím, dátum/időpont, helyszín (név, cím, geo), leírás (rich text), fellépők
  (`slammer` referenciák), jegyURL, borítókép, accentColor (opcionális), status (közelgő/lezárt
  automatikusan dátumból). **Regisztráció:** `registrationEnabled` (be/ki), `registrationEmail`
  (alapérték: `contest@slampoetry.hu`), opcionális egyedi mezők/leírás a jelentkezési formhoz,
  jelentkezési határidő. Ha be van kapcsolva, az esemény-oldalon megjelenik a jelentkezési űrlap.
- `slammer` — név, slug, fotó, bio (rich text), videók (URL-ek), eredmények, social linkek.
- `post` (hír/blog) — cím, slug, dátum, szerző, borító, törzs (rich text), kategória/címkék.
- `mediaItem` — típus (videó/kép), forrás (YouTube URL / kép), kapcsolódó esemény, év, leírás.
- `page` (statikus oldalak: „Mi az a slam poetry?", Egyesület) — cím, slug, rich text, beágyazások.
- `siteSettings` (singleton) — logó, alap accent szín, social linkek, kapcsolati adatok, főmenü.
  **Országos bajnokság CTA:** `championshipCtaEnabled` (be/ki), gomb-felirat (alap:
  „Jelentkezem az országos bajnokságra"), cél (esemény-referencia vagy URL), opcionális
  megjelenítési időszak (-tól/-ig dátum, hogy automatikusan eltűnjön).

### Jelentkezési űrlapok és email-küldés

- **Eseményhez kapcsolt regisztráció:** ha az `event.registrationEnabled` igaz, az esemény-oldalon
  megjelenik egy űrlap (név, email, telefon, üzenet + esemény-specifikus mezők). Beküldéskor egy
  **serverless függvény** (Vercel/Netlify function) emailt küld az `event.registrationEmail` címre
  (alap: `contest@slampoetry.hu`) — pl. **Resend** ingyenes tier vagy SMTP. Visszaigazoló email a
  jelentkezőnek opcionális.
- **Országos bajnokság CTA:** ha a `siteSettings.championshipCtaEnabled` igaz (és a megjelenítési
  időszakban vagyunk), a főoldalon/headerben megjelenik a kiemelt „Jelentkezem az országos
  bajnokságra" gomb, amely a megadott esemény jelentkezési oldalára/űrlapjához visz. Ki van kapcsolva
  → a gomb nem jelenik meg.
- **Spam-védelem:** honeypot mező + egyszerű rate-limit a serverless függvényben; szerver-oldali
  validáció. (Opcionális későbbi bővítés: captcha.)

## Brand-identitás (újraépítés, a logó kivételével)

A meglévő assetek közül **csak a logót** tartjuk meg; minden mást **újraépítünk egy egységes
vizuális márkaidentitássá**. Ennek deliverable-jei:

- **Színrendszer:** alap accent (lila/magenta) + másodlagos/akcentus színek (a poszterek piros,
  sárga, türkiz világa), sötét/világos felület-színek, állapot-színek — design tokenként.
- **Tipográfia-skála:** display + szöveg fontpáros véglegesítése, méret-/súly-skála, betűköz.
- **Textúrák és dekor-elemek:** füst-gradiensek, grain/zaj, tépett-papír matrica, spray/stencil
  foltok — újrafelhasználható komponensként és asset-ként.
- **Ikon-készlet** (egységes stílus), **favicon** és app-ikonok.
- **OG / social megosztó képek** sablonjai (esemény, hír, slammer).
- **Rövid brand guide** (1-2 oldal): színek, tipó, logóhasználat, dekor-elvek — a konzisztenciához.

Ez a design system (lent) alapja; a build elején készül el, hogy minden komponens erre épüljön.

## Design system (a brand alapján)

- **Alaphangulat:** **sötét, drámai hero/fejléc + világos, jól olvasható tartalmi szekciók**
  (hírek, biók hosszú szövege fehér háttéren). Füst/grain textúra és gradiens csak a hero/akcentus
  felületeken.
- **Szín:** alap accent **lila/magenta** (a fő banner alapján), CSS custom property-ként
  (`--accent`), amelyet az egyes **esemény-oldalak felülírhatnak** a saját poszter-színükre
  (rugalmas eseményszínek). Sötét alap ~`#111`, világos tartalom `#fff`.
- **Tipográfia:** vastag, kondenzált, csupa nagybetűs **display** font a címekhez (pl. Anton /
  Archivo Black / hasonló ingyenes Google Font), tiszta, jól olvasható **sans** a törzsszöveghez
  (pl. Inter). A brand játékos kiemelése (egy-egy betű accent színnel) opcionális stíluselem.
- **Akcentus-elemek (mértékkel):** tépett-papír „matrica" címkék, spray/stencil textúra-foltok,
  színes füst-gradiens a hero mögött, duotone/színre hangolt fotók.
- **Logó:** a meglévő töltőtoll-mikrofon logó (a felhasználó biztosítja az SVG/PNG assetet).
- **Reszponzív + a11y:** mobile-first, billentyűzet-navigáció, kontraszt-ellenőrzés (sötét hátteren
  az accent szövegek WCAG AA), `prefers-reduced-motion` tisztelete az animációknál.

### Újrafelhasználható komponensek (Astro)

- `Header` / `Nav` (sötét, ragadós), `Footer` (social + kapcsolat)
- `Hero` (esemény-kiemelő, gradiens + textúra háttér, accent-felülírható)
- `EventCard`, `SlammerCard`, `PostCard`, `MediaCard`
- `EventFilter`, `SlammerSearch` (island, kliens-oldali szűrés/keresés)
- `Gallery` / `Lightbox` (island)
- `RichText` (Sanity Portable Text → HTML renderer)
- `StickerLabel`, `SmokeBackground` (dekor elemek)
- `RegistrationForm` (island — eseményhez kapcsolt jelentkezés, serverless endpointra küld)
- `ChampionshipCtaButton` (siteSettings-vezérelt, feltételesen megjelenő CTA)

## Tartalom-migráció a régi oldalról (webcrawling)

A `slampoetry.hu` régi tartalmát **automatizált crawlinggal** gyűjtjük össze és migráljuk az új
CMS-be. Cél a menthető érték megőrzése — elsősorban:

- **Archív cikkek/hírek** (szöveg, dátum, képek, ahol elérhető).
- **Nem változott adatok/infók:** slammer-nevek/biók, esemény-archívum, egyesületi/szabályzati
  szövegek, kapcsolati infók.

Folyamat:

1. **Feltérképezés + crawl:** a régi oldal URL-jeinek begyűjtése és tartalmuk kinyerése
   (Firecrawl: map → crawl/scrape → markdown/strukturált adat).
2. **Tisztítás + leképezés:** a kinyert tartalom hozzárendelése a Sanity sémához
   (`post`, `event`, `slammer`, `page`, `mediaItem`), képek letöltése/feltöltése a Sanity assetekbe.
3. **Import:** szkript a dokumentumok létrehozására a Sanity-ben (Sanity import / API), majd
   **kézi átnézés** a szerkesztők részéről (a crawl nem lesz tökéletes — ami zajos, azt jelöljük).

> Megjegyzés: a migráció külön, jól izolált fázis, és az új oldal alap-funkcióitól független
> futtatható. Ami nem nyerhető ki tisztán, az kézi újrarögzítésre kerül.

## Bontás / sorrend (megvalósítási fázisok)

0. **Brand-identitás:** színrendszer, tipográfia, textúrák/dekor-elemek, ikonok, favicon, OG
   sablonok, rövid brand guide — design tokenként, amelyre minden további épül.
1. **Alapok:** Astro projekt, Tailwind (vagy CSS modulok) + design tokenek, Sanity projekt +
   sémák, layout/Header/Footer, design system primitívek.
2. **Tartalomtípusok end-to-end:** Hírek (lista+cikk) → Események (lista+részlet, +eseményhez
   kapcsolt jelentkezési űrlap) → Slammerek (rács+profil, kereső) → Médiatár → statikus oldalak
   (Mi az a slam / Egyesület) → Kapcsolat (űrlap).
2b. **Űrlap-backend:** serverless függvény + email-küldés (Resend/SMTP) a jelentkezésekhez;
   spam-védelem; országos bajnokság CTA logika (siteSettings-vezérelt megjelenés).
3. **Főoldal** összerakása a fenti komponensekből.
4. **Migráció:** a régi oldal crawlingja, leképezés a sémára, import a Sanity-be, kézi átnézés.
5. **Polish:** animációk, textúrák, SEO/OpenGraph, sitemap, teljesítmény, a11y audit, deploy +
   Sanity webhook.

> Megjegyzés: ez a terv egy spec. Jóváhagyás után külön, részletes **implementációs tervet**
> készítünk (writing-plans), amely fázisonként/feladatonként bontja le a fenti munkát.

## Verifikáció (hogyan ellenőrizzük)

- `npm run dev` — a látogatói oldal helyben fut, minden szekció elérhető, reszponzív.
- Sanity Studio helyben/hostolva fut; egy teszt-esemény / -hír / -slammer felvétele után a
  tartalom megjelenik a frontenden (rebuild/SSR után).
- Slammer-kereső és esemény-szűrő működik kliens oldalon.
- Egy regisztráció-engedélyezett eseményen az űrlap beküldése emailt kézbesít a
  `contest@slampoetry.hu` címre; honeypot/rate-limit kiszűri a spamet.
- A `championshipCtaEnabled` ki/be kapcsolása valóban megjeleníti/elrejti a CTA gombot.
- Lighthouse: jó teljesítmény + a11y pontszám mobilon; kontraszt-ellenőrzés a sötét felületeken.
- Deploy próbapublikálás (Vercel/Netlify), Sanity-webhook kiváltja az újraépítést.

## Nyitott kérdések / felhasználói input a megvalósításhoz

- A **logó** átadása (SVG/PNG) — ez az egyetlen megtartott brand asset; minden mást újraépítünk.
- Régi tartalom migrálása webcrawlinggal (Firecrawl) — a zajos/hiányos részek kézi átnézést
  igényelnek a szerkesztők részéről.
- Konkrét accent-szín hex értékek és font-választás véglegesítése a build elején.
- Domain/hosting hozzáférés a deployhoz.
- Email-küldéshez fiók/kulcs (pl. Resend API key) és a `slampoetry.hu` domain feladó-hitelesítése
  (SPF/DKIM), hogy a jelentkezések kézbesüljenek.
