# SPM website bot – GitHub Actions átadás

## Cél és döntés
Háromnaponkénti, géptől független Facebook → Sanity hírek/események publikálása. Péter 2026-11-26-án kifejezetten kérte a GitHub Actions megvalósítást és meglévő AI-kulcs keresését. A másik chat dirty munkafája nem kerül a telepítésbe.

## Ellenőrzött kiindulás
- Repó: `slampetrymagyarorszag/spm`, nyilvános, default branch `main`, HEAD `fe805232758cf85dcb22a63e4b2f90d8255a60d1`.
- GitHub CLI Hello-agency-hun pushjoggal; SSH olvasás működik, Actions secrets public-key elérhető. Adminjog nincs.
- Facebook posts/feed/events és Sanity olvasás működik.
- Meglévő OpenAI-kulcs hitelesítése `/v1/models` végponton HTTP 200; GPT-5.4 mini elérhető. Titokérték nincs dokumentálva.
- Jelenleg aktív helyi Codex automatizálás: `spm-website-bot`. Csak az ellenőrzött Actions-indulás után szüneteltetendő.
- Munka elkülönített managed worktree-ben. Ne commitolj másik chatből származó fájlt; ne használj régi Claude git-szerzőt.

## Megvalósítási terv
1. Függőségmentes Node-szkript és célzott tesztek: forrásolvasás, lapozás, duplikációvédelem, eredeti képek, idempotens Sanity tranzakciók.
2. Strukturált AI-szerkesztés, maximum 8 kérés/futás, legfeljebb 1 USD/hó konzervatív, kérés előtt tartósan lefoglalt kerettel. Forrásonként mentett döntés; hiányos forrást nem tekintünk késznek.
3. Actions napi ütemezés 72 órás tartós időkapuval, kézi dry-run/publish, egymást kizáró futások, summary. Külön heartbeat branch megakadályozza a publikus repó 60 napos inaktivitási leállását; alkalmazáskódot nem telepít.
4. Tesztek, helyi read-only/dry-run, titkok biztonságos Actions Secrets-felvétele, csak a bot fájljainak commitja/pushja.
5. Kézi Actions-próba, majd publikáló futás és Sanity/élő web ellenőrzés. Helyi automatizálás szüneteltetése, runbook frissítése.

## Korlátok
Nincs tartalomtörlés vagy kézi draft felülírása. Hiányzó tényt nem találunk ki. A Facebook megosztott esemény csak az API-ból igazolt adatokkal vehető át; hozzáférési hibát konkrétan jelezni kell. Az AI-korlát erre a botra vonatkozik, nem a teljes közös OpenAI-fiókra. A nyilvános repóban nem lehet token, emailcím, teljes forrásarchívum vagy érzékeny napló.

## Implementációs mérföldkő
- Elkészült `scripts/spm-bot/{core,services,run}.mjs`, célzott core/services/run tesztek és `.github/workflows/spm-website-bot.yml`.
- Helyi read-only dry-run sikeres valódi Facebook/Sanity/OpenAI modellel, fizetős generálás és CMS-írás nélkül. Három szerkesztendő forrást talált, az EB-hírt és a decemberi eseményt meglévőként felismerte.
- Hat szükséges `SPM_BOT_*` secret biztonságosan felvéve a GitHub Actions Secretsbe. A régi, más projektből származó kulcs helyi fájlja nem módosult.
- 20 célzott teszt zöld volt az utolsó esemény-helyszín/borító javítás előtt; újrafuttatandó a release előtt. Sanity POST query `perspective=raw` URL-paraméterrel működik, JSON-bodyban nem fogadott; erre regressziós teszt van.
- Következő: végső tesztek/workflow lint, kizárólag botfájlok commit/push main-re SSH-val, GitHub dry-run majd publish, élő ellenőrzés, helyi automatizálás szüneteltetése. A `spm-bot-report.json` helyi kimenet, nem commitolandó.

## Folytató prompt
Folytasd az SPM GitHub Actions botot a docs/automation/codex-handoff.md alapján. Ellenőrizd a tényleges fájlokat és futásokat. Fejezd be a tesztelt botot, állítsd be a meglévő kulcsokat Actions Secretsként titkok kiírása nélkül, telepítsd kizárólag a bot változásait, próbáld ki GitHubon, majd a sikeres szerveroldali futás után szüneteltesd a helyi spm-website-bot automatizálást. A másik chat dirty munkafáját őrizd meg.
