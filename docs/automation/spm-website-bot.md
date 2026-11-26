# SPM website bot – GitHub Actions

Péter engedélyezte a Facebook-oldal új híreinek, saját és megosztott slam-eseményeinek önálló Sanity-publikálását. A bot a GitHubon fut, a Mac és a Codex alkalmazás működése nélkül. A másik chat adminfelület-fejlesztésétől független.

## Működés

- Workflow: `.github/workflows/spm-website-bot.yml`, [futások](https://github.com/slampetrymagyarorszag/spm/actions/workflows/spm-website-bot.yml).
- Naponta 08:17 UTC-kor ébred. Sanityben tárolt 72 órás időkapu alapján háromnaponta dolgozik. Ez télen 09:17, nyáron 10:17 Budapesten; a GitHub ütemezése késhet.
- Kézi indítás: Actions → SPM website bot → Run workflow. Alapértelmezés: `dry-run`, amely nem ír CMS-adatot és nem hív fizetős AI-generálást. A `publish` valóban publikál. A `force` kizárólag a 72 órás várakozást kerüli meg, a költségkorlátot nem.
- Az első ellenőrzés az utóbbi 14 nap posztjait és a közelgő eseményeket olvassa; később legalább 7 nap átfedéssel dolgozik. Posts és feed lapozás, csak az oldal saját bejegyzései/megosztásai. Látogatói bejegyzéseket nem importál.
- A megosztásokban és almegosztásokban lévő Facebook-eseménylinkeket is feloldja. Ha az eredeti eseményhez nincs API-hozzáférés, hibát jelez; nincs automatikus böngészős bejelentkezés vagy kitalált adat.
- Eseménynél az eredeti cím, leírás, kép, helyszín, időzónás dátum, Facebook-link és elérhető jegylink kerül át. Meglévő eseménynél csak az igazolt időpont/helyszín/jegylink változhat, revízióvédelemmel. Kézi leírást és draftot nem ír felül, nem töröl.
- Hírnél strukturált OpenAI-válasz készül magyar és angol szöveggel, forrásidézetekkel. Üres megosztás, köszönet, jegyelővételi emlékeztető, általános meghívó kimarad. A program ellenőrzi a számokat és forrásidézeteket; az eredeti Facebook-linket és képet a program adja hozzá. A modell állításait ez nem bizonyítja tévedhetetlennek.
- Duplikációvédelem: publikált és draft dokumentumok, Facebook-ID/link, stabil bot-ID, cím és eseménydátum; a modell a meglévő hírcímeket/bevezetőket is összeveti a forrással.
- Sikeres írás után Sanity-visszaolvasás és élő HTML-ellenőrzés történik. A bot nem végez böngészős vizuális QA-t. Hiányos forrás vagy hibás publikálás nem lépteti előre a sikeres checkpointot. Már mentett dokumentumot újrapróbáláskor nem generál újra.

## Állapot és költség

Sanity technikai dokumentumok: `spmBotState` (`spmBot.state`) és `spmBotSource`. A publikus oldal lekérdezései ezeket nem használják. Nincs helyi állapotfájltól vagy Actions-cache-től való függés.

Modell: `gpt-5.4-mini-2026-03-17`. Legfeljebb 8 kérés/futás, 4000 kimeneti token/kérés, legfeljebb 24 000 bájtos szerkesztési bemenet. Minden kérés ELŐTT 4 US centet foglal le tartósan a havi 100 centes keretből; sikertelen kérésnél sem oldja fel. A 2026-11-26-án ellenőrzött standard ár mellett ez konzervatív felső korlát, nem a tényleges költés. Havi legfeljebb 25 kérés engedett; keretelfogyáskor a következő hónapig leáll az AI-szerkesztés, az események feldolgozása folytatódik. A korlát kizárólag erre a botra vonatkozik, nem a közösen használt API-kulcs más projektjeire. Modell/ár változásakor a korlátot újra kell számolni.

A repó nyilvános, a standard Ubuntu runner ezért Actions-számítási díj nélkül használható. Nem töltünk fel artifactot/cache-t. [GitHub díjazás](https://docs.github.com/en/billing/concepts/product-billing/github-actions). [OpenAI modellár](https://developers.openai.com/api/docs/models/gpt-5.4-mini).

A nyilvános repók ütemezését GitHub 60 nap repó-inaktivitás után letilthatja. A workflow külön `codex/spm-bot-heartbeat` ágon apró heartbeat-commitot készít `[skip ci] [skip vercel]` jelöléssel, az alkalmazás `main` ágának módosítása nélkül. A job csak ehhez kap `contents: write` jogosultságot; a tartalomfrissítő job read-only GitHub-jogot kap. Ha a repó szabályai ezt később tiltják, a heartbeat job hibáját javítani kell.

## Titkok és üzemeltetés

Actions Secrets: `SPM_BOT_FB_PAGE_ID`, `SPM_BOT_FB_TOKEN`, `SPM_BOT_SANITY_PROJECT_ID`, `SPM_BOT_SANITY_DATASET`, `SPM_BOT_SANITY_TOKEN`, `SPM_BOT_OPENAI_API_KEY`. Meglévő helyi konfigurációból kerülnek fel; értékük soha nem kerül a repóba vagy naplóba. Nincs szükség új API-kulcs vásárlására/létrehozására.

A Facebook-token vagy az OpenAI-egyenleg lejárhat. A hibás run piros lesz az Actionsben, és a GitHub-fiók értesítési beállításai szerint jelez; külön email/Messenger-küldő nincs. A summary tartalmazza az eredményt, linkeket és hibákat, a részletes gépi riport a futás munkakönyvtárában készül. A checkpointból a legutóbbi eredmény később is lekérdezhető.

Leállítás: GitHub Actions → workflow menü → Disable workflow. Visszakapcsolás: Enable workflow. A korábbi helyi Codex-automatizálás (`spm-website-bot`) 2026-11-26-án szüneteltetve lett a sikeres GitHub-indulás után, hogy ne legyen két publikáló.

Első igazolt GitHub-futások: [read-only próba](https://github.com/slampetrymagyarorszag/spm/actions/runs/45836680752), [valódi feldolgozás](https://github.com/slampetrymagyarorszag/spm/actions/runs/45836776923). Mindkettő sikeres. A feldolgozás három AI-kérést végzett, új cikket/eseményt nem talált publikálásra; a meglévő EB-hírt és december 2-i eseményt felismerte. Ezért új dokumentum éles létrehozása még nem volt megfigyelhető; annak útvonalát integrációs tesztek ellenőrzik. Az esemény élő HTML-ellenőrzése sikeres volt. A heartbeat branch létrehozása és írása is sikeres.

## Ellenőrzés

Függőségtelepítés nem szükséges, Node 24 kell:

```sh
node --test scripts/spm-bot/*.test.mjs
node scripts/spm-bot/run.mjs
node scripts/spm-bot/run.mjs --apply
```

A helyi futtatáshoz a megfelelő környezeti változók szükségesek. Az alkalmazás UI-ját, Sanity-sémáit és csomagfüggőségeit a bot telepítése nem módosítja.
