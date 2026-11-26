import { useMemo, useState } from 'react';
import { Box, Card, Flex, Heading, Stack, Text, TextInput } from '@sanity/ui';
import { IntentLink } from 'sanity/router';

const topics = [
  {
    title: 'Első belépés, mentés és publikálás', where: 'slampoetry.hu/admin → Tartalom',
    steps: [
      'A meghívott emailcímeddel lépj be. Ha nincs hozzáférésed, Pétertől kérj meghívót; egy másik emailcímmel létrehozott fiók nem kapja meg automatikusan a jogosultságot.',
      'A Tartalom menüben válaszd ki, mit szerkesztenél. Új bejegyzést a lista tetején lévő létrehozás / ceruza gombbal tudsz indítani.',
      'A Sanity gépelés közben automatikusan menti a piszkozatot. Ettől az új tartalom még nem kerül ki a weboldalra.',
      'Töltsd ki a kötelező mezőket, ellenőrizd a figyelmeztetéseket, majd kattints a Publish / Közzététel gombra. Meglévő bejegyzés módosítását is publikálni kell.',
      'Nyisd meg a nyilvános oldalt, és ellenőrizd a címet, képet, dátumot és linkeket. A médiatár frissülése a gyorsítótár miatt körülbelül 15–20 percet is igénybe vehet.',
    ],
    tip: 'A piszkozat, a közzététel visszavonása és a törlés külön művelet. Meglévő tartalom átírása előtt ellenőrizd, hogy biztosan a megfelelő bejegyzést nyitottad meg.',
  },
  {
    title: 'Hír vagy beszámoló feltöltése', where: 'Tartalom → Hírek', type: 'post',
    steps: [
      'Adj rövid, informatív címet, majd a Megjelenés fül Webcím azonosítója mezőjében generáld a webcímet. Már megosztott hír slugját lehetőleg ne változtasd meg.',
      'A Megjelenés mezőbe írd a kívánt megjelenési dátumot és időt. A jövőbeli megjelenési idővel publikált hír csak az adott időpont után látszik a nyilvános hírek között.',
      'Töltsd fel a borítóképet, írj rövid Bevezetőt, majd a Tartalom mezőbe a cikket. A szerkesztőben kijelölt szövegre linket és kiemelést is tehetsz.',
      'Add meg a szerzőt, a releváns címkéket és – ha rendelkezésre állnak – az angol mezőket. A SEO / megosztás mezők opcionálisak; üresen az oldal a címet, bevezetőt és borítót használja.',
      'Publikáld, majd a Hírek oldalon nyisd meg és olvasd át. Eredményeket, pontszámokat és idézeteket az eredeti forrással vess össze.',
    ],
    tip: 'A Facebook-poszt átvétele külön eszköz: a Tartalom → Hírek → Hír átvétele Facebookról eszközben kiválasztott posztból piszkozat készül. Nézd át a címet, a szöveget és a kép átvételét, majd te publikáld.',
  },
  {
    title: 'Esemény felvitele a naptárba', where: 'Tartalom → Eseménynaptár → Összes esemény és új esemény', type: 'event',
    steps: [
      'Új eseménynél add meg a címet, a kezdő időpontot és a generált slugot. Egynapos eseménynél a Befejezés mezőt hagyd üresen.',
      'Másold be a Facebook esemény linkjét. A link az oldalon Facebook-gombot ad; a leírást külön másold a Leírás mezőbe.',
      'Az Esemény borítóképe mezőnél a Facebook-átvétel gombbal kérheted a képet, vagy feltölthetsz sajátot. Ha az átvétel hibát jelez, töltsd fel kézzel.',
      'A Részletek fülön add meg a helyszín nevét, címét és a jegylinket. Az angol szövegek és a fellépőhivatkozások opcionálisak.',
      'Ha csak később szeretnéd megmutatni az eseményt, állítsd be a Megjelenés az oldalon ettől mezőt. Üresen a publikált esemény azonnal látszik.',
      'Publikálás után ellenőrizd az Események oldalt és az esemény saját oldalát: időpont, helyszín, borító, jegy- és Facebook-link.',
    ],
    tip: 'Egy havi klub naptárbejegyzése és a havi jelentkezési űrlap külön beállítás. Az esemény létrehozása önmagában nem indít új jelentkezési időszakot.',
  },
  {
    title: 'Képek feltöltése és vágása', where: 'Hír / esemény / slammer → megfelelő képmező',
    steps: [
      'Húzd a képet a mezőbe, vagy válaszd az Upload / Feltöltés lehetőséget. Meglévő képet a médiaválasztóból is újra felhasználhatsz.',
      'Hírhez és eseményhez általában fekvő borítóképet válassz. Ha csak álló kép van, nézd meg, hogyan vágja az oldal a kártyán.',
      'A kép szerkesztésénél a hotspot / fókuszpont jelöli a fontos részt: portrénál az arc, eseményképnél a központi motívum maradjon látható.',
      'Ahol van Alt szöveg mező, röviden írd le a kép tartalmát. A fotós nevét a cikk szövegében is tüntesd fel, ha ismert.',
      'Publikálás után nézd meg a képet asztali és mobilnézetben is. Ha fontos szöveg van a képen, annak lényegét a bejegyzésben is írd le.',
    ],
  },
  {
    title: 'YouTube-videók, playlistek és a médiatár', where: 'Tartalom → Médiatár; Oldalszövegek és beállítások → YouTube és letöltések', type: 'mediaItem',
    steps: [
      'Az SPM YouTube-csatorna legújabb videói és legfrissebb nyilvános, nem üres playlistjei automatikusan megjelennek a médiatárban. A playlistet a YouTube-on az SPM csatornáján hozd létre, állítsd Nyilvánosra, és tegyél bele legalább egy elérhető videót.',
      'A frissítéshez nem kell kézzel Sanity-bejegyzést létrehozni. A weboldal lekéréskor ellenőrzi a csatornát; a gyorsítótár miatt körülbelül 15–20 percet várj.',
      'Egy régebbi vagy külön kiemelendő playlistet kézzel is felvehetsz: új Médiatár elem → YouTube lejátszási lista → cím, teljes playlistlink, év. A teljes linkben legyen list= kezdetű azonosító.',
      'Egyetlen videóhoz válaszd a YouTube videó típust, és másold a videó teljes linkjét a YouTube URL mezőbe. Facebook-albumhoz külön albumtípus és albumlink tartozik.',
      'A playlistekből az oldalon hat videó látszik előnézetként; a Teljes lejátszási lista gombbal az összes videó megnyitható. A kézzel megadott cím elsőbbséget kap, és ugyanaz a lista nem jelenik meg kétszer.',
      'Az automatikus átvétel az Oldal beállítások → Új YouTube-playlistek automatikus megjelenítése kapcsolóval kikapcsolható. A kézzel felvett listák ettől megmaradnak.',
    ],
    tip: 'Nem listázott és privát playlistek nem kerülnek át automatikusan. Ha YouTube-hiba miatt hiányzik egy lista, ellenőrizd a láthatóságot, majd próbáld később újra.',
  },
  {
    title: 'Slammerek és a főoldali sorrend', where: 'Tartalom → Slammerek → Összes profil / Főoldali kiemelés és sorrend', type: 'slammer',
    steps: [
      'Az Összes slammer listában válassz meglévő profilt, vagy hozz létre újat. Előbb keress rá a névre, hogy ne legyen duplikáció.',
      'Töltsd ki a nevet, a generált slugot, a bemutatkozást és a portrét. A további adatokat a profil tényleges mezői szerint add meg.',
      'A Főoldali kiemelés fülön kapcsold be a Kiemelt a főoldalon mezőt. A Kiemelés sorrendje mezőben kisebb szám jelent előrébb lévő helyet: az 1 az első.',
      'Helycserénél mindkét slammer sorszámát módosítsd és publikáld. A többi profil sorrendjéhez nem kell hozzányúlni.',
      'Új jelentkezésnél a Beérkezett kérések → Új slammer jelentkezése listát nyisd meg. Ha már létezik ilyen profil, összehasonlítást kapsz, és a kijelölt mezőket tudod frissíteni. Új személynél az Új slammerprofil létrehozása gomb készít nyilvános profilt.',
    ],
    tip: 'A profiljavítás a Beérkezett kérések → Meglévő slammer profiljavítása alatt található. A jelenlegi és beküldött adatokat összehasonlítva jelöld ki az átvezetendő mezőket, majd kattints a Kijelölt változtatások élesítése gombra. Ez az eredeti profilt frissíti és a kérést is lezárja. Az eltávolítás külön, a profil közzétételének visszavonásával történik.',
  },
  {
    title: 'Havi klub és bajnokság: jelentkezések kezelése', where: 'Tartalom → Versenyjelentkezések',
    steps: [
      'A Jelentkezések beállításai eszközben a havi klub és az országos bajnokság külön vezérelhető. Válaszd a megfelelő részt.',
      'A havi klubnál ellenőrizd a hónap címkéjét, a gomb szövegét, az engedélyezést, valamint a nyitás és zárás idejét. Új hónapot a következő havi klub előkészítésével is indíthatsz; az előkészítés kikapcsolt állapotot ad.',
      'Az időzítés mellett az engedélyezés is számít. A módosítás után használd az eszköz mentés gombját, és ellenőrizd a nyilvános oldalon a jelentkezési lehetőséget.',
      'A jelentkezők a Tartalom → Versenyjelentkezések alatt találhatók: Jelentkezők és export, valamint a beküldési napló.',
      'A Jelentkezések export eszközben típusra, konkrét klubra/hónapra és beküldési időszakra szűrhetsz, majd CSV-t tölthetsz le.',
    ],
    tip: 'A napló tényleges beküldéseket tartalmaz. A következő hónap előkészítéséhez nem kell a korábbi jelentkezéseket törölni.',
  },
  {
    title: 'Beküldött események és vidéki klubok', where: 'Tartalom → Beérkezett kérések → Eseménytippek / Klubok jóváhagyása',
    steps: [
      'A várakozó beküldéseket az Áttekintés számlálói és a Tartalom megfelelő listái jelzik.',
      'Eseménytippnél ellenőrizd a forrást, a dátumot, a helyet és az elérhetőségeket. Az Eseménnyé alakítás művelet piszkozatot készít, amelyben a tényleges időpontot és a többi adatot még ki kell tölteni.',
      'A Klubok → Elbírálásra vár listában nézd át a beküldött klubot. A jóváhagyott és publikált klub jelenhet meg a nyilvános klublistában.',
      'Publikálás után a nyilvános listán is ellenőrizd, hogy a megfelelő város, cím és link szerepel-e.',
    ],
  },
  {
    title: 'Oldalszövegek, Oktatás és letölthető PDF-ek', where: 'Tartalom → Oldalszövegek és beállítások',
    steps: [
      'Az Oldalak alatt az ott szereplő statikus tartalmi oldalak szövegeit találod. A weboldal főmenüjének szerkezete külön fejlesztési beállítás; egy új Oldalak-bejegyzés önmagában nem ad új menüpontot.',
      'Az Oktatás menüpontban külön magyar és angol szövegek vannak. Üres mezőnél az oldal beépített alapértelmezett szövege marad látható.',
      'Az Oldal beállítások között a főoldali szövegek, kapcsolati címek, médiatári PDF-ek és egyéb központi tartalmak szerkeszthetők.',
      'Médiatári PDF-hez a Letölthető dokumentumok mezőben adj címet, rövid leírást és fájlt vagy külső linket, majd publikáld a beállítást.',
    ],
    tip: 'Az oktatási érdeklődőknek emailben küldött PDF külön fájl a weboldal csomagjában. A médiatárba feltöltött PDF nem cseréli le automatikusan az emailcsatolmányt.',
  },
  {
    title: 'Sajtólista és sajtóközlemény', where: 'Tartalom → Sajtó',
    steps: [
      'A Sajtólista alatt kezeld a sajtókapcsolat nevét, emailcímét, médiumát és címkéit.',
      'A Sajtóközlemény küldése eszközben válaszd ki a címzettcsoportot, írd be a tárgyat és a levélszöveget. A tényleges címzettlistát küldés előtt ellenőrizd.',
      'Először saját címre küldött tesztlevéllel ellenőrizd a szöveget és a linkeket, majd a külön megerősítéssel indítható a kiküldés.',
    ],
    tip: 'A sajtóközlemény küldése emailt küld a címzetteknek; nem hoz létre automatikusan hírt a weboldalon. A hírt külön a Hírek menüben vidd fel.',
  },
  {
    title: 'Nem látszik a változtatás? Gyors hibakeresés', where: 'A szerkesztett bejegyzés és a nyilvános oldal',
    steps: [
      'Publikáltad, vagy csak piszkozatként mentetted? A Publish / Közzététel gombot meglévő tartalom módosításakor is használni kell.',
      'Nincs jövőbe állítva a hír Megjelenés vagy az esemény Megjelenés az oldalon ettől mezője? Elmúlt eseményt a Korábbi események között keress.',
      'A médiatárnál várj körülbelül 15–20 percet, majd töltsd újra. YouTube-listánál nézd meg, nyilvános-e és van-e benne elérhető videó.',
      'Ha a kép hiányzik, valóban kiválasztottál vagy feltöltöttél fájlt a megfelelő képmezőben? A Facebook-link önmagában nem borítókép.',
      'Ha továbbra sem jó, küldd Péternek a szerkesztett bejegyzés címét, az oldal linkjét és a pontos hibaüzenetet. Így a megfelelő helyen lehet utánanézni.',
    ],
  },
];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hu');

export function HelpTool() {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => topics.filter(topic => normalize([topic.title, topic.where, ...topic.steps, topic.tip || ''].join(' ')).includes(normalize(query.trim()))), [query]);
  return <Card padding={[3, 4]} style={{ height: '100%', overflowY: 'auto', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 14 }}>
    <Stack space={4} style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 40 }}>
      <Stack space={3}>
        <Heading size={3}>Hogyan használd az SPM weboldalát?</Heading>
        <Text size={2} style={{ lineHeight: 1.7 }}>Szerkesztői súgó: mit hol találsz, hogyan tölts fel tartalmat, és mikor kerül ki az oldalra.</Text>
        <Flex gap={4} wrap="wrap">
          <a href="/admin#/structure">Tartalom megnyitása</a>
          <a href="/admin#/attekintes">Szerkesztői áttekintés</a>
          <a href="https://slampoetry.hu" target="_blank" rel="noopener noreferrer">Nyilvános weboldal ↗</a>
        </Flex>
      </Stack>
      <TextInput aria-label="Keresés a súgóban" placeholder="Keress rá: esemény, kép, YouTube, jelentkezés…" value={query} onChange={event => setQuery(event.currentTarget.value)} />
      <Text size={1} muted>{query ? `${matches.length} találat` : 'Válassz témát, és nyisd le a lépéseket.'}</Text>
      {matches.map(topic => <Card key={topic.title} padding={4} radius={2} border>
        <details open={query.trim() ? true : undefined}>
          <summary style={{ cursor: 'pointer', fontWeight: 650, fontSize: 18, lineHeight: 1.5 }}>{topic.title}</summary>
          <Stack space={4} marginTop={4}>
            <Text size={1} weight="semibold" style={{ lineHeight: 1.7 }}>{topic.where}</Text>
            <Box><ol style={{ paddingLeft: 24, margin: 0 }}>{topic.steps.map(step => <li key={step} style={{ lineHeight: 1.8, marginBottom: 12 }}>{step}</li>)}</ol></Box>
            {topic.tip && <Card padding={3} radius={2} tone="primary"><Text size={1} style={{ lineHeight: 1.7 }}>{topic.tip}</Text></Card>}
            {'type' in topic && topic.type && <Text size={1}><IntentLink intent="create" params={{ type: topic.type }}>Új bejegyzés létrehozása ↗</IntentLink></Text>}
          </Stack>
        </details>
      </Card>)}
      {!matches.length && <Card padding={4} border><Text>Nincs találat. Próbálj rövidebb szót, például: kép, hír vagy klub.</Text></Card>}
    </Stack>
  </Card>;
}
