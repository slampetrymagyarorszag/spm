# SPM admin/CRM UX – munkafolyamat-átadás

## Cél és állapot

A Sanity Studióban a jelentkezések, beküldések, klubok, események és Facebook-import kezelése legyen egyértelmű; az időzített havi klub és az új tartalom ne ragadjon be a statikus buildbe. A felhasználó a befejezett, ellenőrzött változat élesítését engedélyezte. Az élő Sanity-adatokon nem történt írás.

## Elkészült

- `src/sanity/tools/SubmissionsExportTool.tsx`: típus, havi klub (`contextLabel`) és beküldési hónap szerinti CSV-szűrés; a törlés kijelölése rögzített.
- `src/sanity/tools/RegistrationSettingsTool.tsx`: külön havi klub/bajnoksági jelentkezésvezérlő, állapotjelzés, időzítés-ellenőrzés, következő havi klub előkészítése kikapcsolt állapotban.
- `src/sanity/actions/promoteSlammer.tsx`, `src/sanity/components/PromoteSlammerInput.tsx`: a slammerprofil létrehozása az űrlap elején látható, idempotens atomi tranzakciót használ.
- `src/sanity/actions/promoteEventTip.tsx`: eseménytippből dátum nélküli piszkozat készül, atomi tranzakcióval; nem kerül helykitöltő „most” esemény élesbe.
- `src/pages/api/import-fb-post.ts`, `src/sanity/tools/FacebookImportTool.tsx`: az API csak Facebook-adatot olvas; a bejelentkezett szerkesztő saját jogosultságával hírpiszkozatot hoz létre, és jelzi a képátvételi hibát.
- `src/pages/api/facebook-event-cover.ts`, `src/sanity/components/FacebookEventCoverInput.tsx`: saját Facebook-esemény borítójának egykattintásos átvétele, meglévő borító felülírása nélkül. Az endpoint csak olvas; két éles FB-eseménynél a Graph-borító olvasható volt, a helyi API 200-as válasszal JPEG-et adott.
- `src/sanity/tools/EditorialDashboardTool.tsx`: szerkesztői áttekintés teendőkkel, közelgő események borítóhiány-jelzésével és hírpiszkozatokkal.
- `src/sanity/schemaTypes/{event,slamClub,mediaItem,siteSettings}.ts`: egyértelműbb űrlapok, eseményborító a fő csoportban, típusfüggő médiatár- és időzítésvalidáció. Az esemény `showFrom` mezője a havi klub vagy más esemény nyilvános megjelenését külön időzíti.
- Főoldal, események és hírek HU/EN útvonalai SSR-re állítva; `src/sanity/lib/queries.ts` kizárja az átalakított közösségi tippek duplikált megjelenését, és a még nem esedékes hírt a publikus részletlekérdezésből.

## Ellenőrzött állapot

- Végső `npm test`: 17 fájl, 224 teszt sikeres.
- Végső `npm run build`: sikeres 2026-09-26-án. A főoldal, hír- és eseményútvonalak szerveroldaliak; a többi érintetlen oldal maradt statikus.
- Helyi Playwright: `/`, `/esemenyek`, `/hirek`, `/admin` HTTP 200, JS kivétel nélkül; a publikus képernyőképek vizuálisan rendben. A helyi `/admin` a Sanity „Connect this studio” képernyőjén áll meg, mert localhost nincs regisztrálva; az új bejelentkezett admin-komponensek böngészős próbája emiatt nem történt meg. Egy külön subagent az ÉLES `/admin` felületet olvasóként auditálta, ott nem mentett semmit.
- A helyi `/api/facebook-event-cover` valódi SPM Facebook-eseménnyel HTTP 200, `image/jpeg`, kb. 590 KB képet adott.
- `git diff --check` hibamentes. A `.claude/settings.local.json` korábbi, felhasználói módosítását nem érintettük.
- A teljes `astro check` 57 hibát jelez a korábban is meglévő projektrészekben (például `sanity:client` típusfeloldás, `ScrollMic` nullability); a módosított TypeScript fájlokra célzott `tsc`-szűrés nem adott hibát. Az ellenőrző csomagokat csak átmenetileg telepítettük, a lockfile visszaállt.

## Hátralévő ellenőrzés és kockázat

1. A saját esemény borítójának Studio-gombját hitelesített felületen, kizárólag próba/piszkozat mellett kipróbálni, ha van regisztrált fejlesztői host. Éles tartalomhoz ne nyúljon a teszt.
2. A Facebook-import és slammer/event átalakítás felületi tesztje hitelesített környezetben még hiányzik; automatizált tesztből sem szabad éles Sanity-írást indítani.
3. A teljes `astro check` meglévő 57 hibája külön technikai adósság; ne keverd össze a zöld teszt/build eredménnyel.

## Következő lépések

1. Csak a feladathoz tartozó fájlokat stage-elni, a `.claude/settings.local.json` módosítást kihagyni; célzott diffellenőrzés.
2. Commit és push `main`-re a felhasználó élesítési engedélye alapján.
3. GitHub/Vercel Production deploymentet megvárni, sikertelen buildnél javítani.
4. Az éles főoldal/hírek/események és `/admin` read-only smoke-ja; a Facebook-borító API-ja csak olvasással.
5. Eredmény rövid átadása: commit, éles státusz, változások, hitelesített admin-írásteszt hiánya.

## Folytató prompt

„Folytasd az SPM admin/CRM UX élesítését a `docs/codex-handoff.md` alapján. A végső teszt és build zöld. A felhasználó engedélyezte az élesítést: csak a feladathoz tartozó fájlokat commitold/pushold `main`-re, majd ellenőrizd a Vercel Production deployt és az élő oldalt. A `.claude/settings.local.json` felhasználói változását hagyd érintetlenül.”
