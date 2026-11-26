# SPM website bot – GitHub Actions átadás

## Cél és mérföldkő
Elkészült és éles: háromnaponkénti, géptől független Facebook → Sanity hír-/eseményfeldolgozás. Péter a megvalósítást, kulcskeresést és automatikus tartalmi publikálást engedélyezte. A másik chat adminfejlesztése ettől független.

## Fontos fájlok
- `.github/workflows/spm-website-bot.yml`: napi 08:17 UTC ébresztés, 72 órás Sanity-kapu, kézi dry-run/publish, konkurenciazár, heartbeat.
- `scripts/spm-bot/{core,services,run}.mjs`: forrásolvasás, eredeti képek, AI-szerkesztés, duplikációvédelem, Sanity-írás/visszaolvasás, élő HTML-ellenőrzés.
- Három `*.test.mjs`: 22 célzott teszt, minden teszt sikeres. `actionlint` és `git diff --check` sikeres. Nincs új csomagfüggőség, alkalmazáskód/séma nem változott.
- `docs/automation/spm-website-bot.md`: teljes üzemeltetési útmutató és korlátok.

## Igazolt éles állapot
- Repó `slampetrymagyarorszag/spm`, nyilvános, workflow aktív. A standard Ubuntu runner ingyenes.
- Első telepítés: `c8711a4`; aktuális Actions-verziók és korlátos AI-kontextus: `b9f26d7`. Csak botfájlokat pusholtunk, Codex szerzővel, a korábbi Claude git-identitás használata nélkül.
- Read-only run `45836680752`: sikeres.
- Valódi feldolgozás `45836776923`: sikeres, 3 valódi OpenAI-kérés, 0 új publikáció, 0 hiba. Meglévő EB-hír és decemberi klubesemény felismerve, az esemény élő HTML-je ellenőrizve. Három további forrás nem bizonyult önálló hírnek.
- Ismétlés `45837227934`: sikeres, 0 új AI-kérés, nincs duplikáció. Mindkét job, köztük a heartbeat-ág írása sikeres.
- Sanity `spmBot.state`: sikeres checkpoint, novemberi `reservedCents=12`. Ez konzervatív előfoglalás, nem a tényleges API-költés. A summary új kérés nélküli futáskor kezdetben tévesen 0-t jelzett; a végső javítás a tartós állapotot írja ki, regressziós teszttel.
- Hat `SPM_BOT_*` Actions Secret felvéve meglévő helyi Facebook/Sanity/OpenAI-konfigurációból. Titokérték nem került repóba/naplóba. Meglévő OpenAI-kulcs valódi generálással is használhatónak bizonyult; helyi forrása nem módosult.
- Helyi Codex automatizálás `spm-website-bot`: PAUSED, toollal és fájlból is ellenőrizve. GitHub az egyetlen aktív publikáló.

## Korlátok
- Új éles dokumentum létrehozása az első futásokban nem volt szükséges; ezt az útvonalat integrációs tesztek ellenőrzik. Ne állítsunk megtörtént új publikálást.
- Nyilvános repó standard runner ingyenes; az AI külön számlázott. GPT-5.4 mini rögzített snapshot, legfeljebb 8 kérés/futás és 25 kérés/hó, minden kérés előtt 4 cent tartós foglalás, havi 1 USD botkeret. Ez nem a közös API-kulcs teljes fióklimitje.
- Nincs kézi draft/leírás felülírása vagy tartalomtörlés. Megosztott esemény csak hozzáférhető eredeti API-adatokkal importálható; hozzáférési hiba konkrétan jelentendő. Nincs automatikus böngészős fallback és vizuális QA.
- A `codex/spm-bot-heartbeat` ág a GitHub 60 napos repó-inaktivitási leállását előzi meg, main módosítása nélkül. A külön job kap contents:write jogot.
- A másik chat változásait semmilyen módon ne reverteld/stage-eld. Csak a bot fájljai kerülhetnek bot-commitba.

## Következő üzemeltetési lépések
1. A következő ütemezett futás summaryját szükség esetén ellenőrizni az Actions oldalon.
2. Piros futásnál a konkrét Facebook-token / AI-egyenleg / forrás / HTML hibát javítani, sikertelen forrást nem késznek jelölni.
3. Modellár vagy Sanity-séma változásakor a bot korlátait és mappingjét célzott tesztekkel felülvizsgálni.

## Folytató prompt
Az SPM GitHub Actions botot kezeld a docs/automation/codex-handoff.md és spm-website-bot.md alapján. Először az aktuális workflow-futást és Sanity checkpointot ellenőrizd. A GitHub bot aktív, a régi helyi Codex automatizálás szünetel; ne indíts két publikálót. Csak igazolt új forrásból publikálj, ne duplikálj, ne nyúlj a másik chat adminfejlesztéséhez, és ne írd ki a kulcsokat.
