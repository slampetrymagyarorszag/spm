# Press Outreach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kutatással alátámasztott, Google Docsban szerkeszthető sajtóközlemény, legfeljebb 30 ellenőrzött címzett és biztonságos, egyenként perszonalizált Resend-kiküldés létrehozása.

**Architecture:** A kampány a weboldal runtime-jától elkülönített lokális operációs eszköz lesz. A trackelt `scripts/press/` modulok validálnak, renderelnek és küldenek; a valódi címzettek, szövegek, képek, exportok és naplók a gitignore-olt `press/private/` és `press/output/` mappában maradnak. A közös szerkesztés natív Google Docsban történik, majd a jóváhagyott pillanatkép kerül a helyi küldési csomagba.

**Tech Stack:** Node.js 22 ESM, Vitest, meglévő `resend` csomag, natív Google Drive/Docs connector, Python-alapú `peter-irta` Mind Vault Engine v3.

**Spec:** `docs/superpowers/specs/2026-08-24-press-outreach-design.md`

## Global Constraints

- Sem push, sem PR, sem production deploy nem készül; csak helyi commitok.
- A production oldalhoz, Sanity-sémákhoz, Vercel-konfigurációhoz és publikus API-route-okhoz nem nyúlunk.
- Valódi email csak Péter külön, explicit végső utasítására küldhető.
- Maximum 30 jóváhagyott címzett; minden címzett külön emailt kap.
- Csak nyilvánosan közzétett szakmai vagy szerkesztőségi emailcím használható.
- A feladó `Slam Poetry Magyarország <media@slampoetry.hu>`, a reply-to `media@slampoetry.hu`.
- A kreatív szöveg a `peter-irta` skill teljes munkarendje szerint készül.
- Vajna Balázs idézete jóváhagyás nélkül nem kerülhet a küldendő változatba.
- Minden API-kulcs kizárólag környezeti változóból olvasható.

---

## Planned File Structure

### Trackelt fájlok

- `scripts/press/contracts.mjs` — kampány-, címzett- és send-log adatszerződések.
- `scripts/press/validate.mjs` — teljes kampányvalidáció és duplikációellenőrzés.
- `scripts/press/hash.mjs` — stabil kampányujjlenyomat.
- `scripts/press/render.mjs` — plain-text és HTML email renderelése.
- `scripts/press/resend-client.mjs` — keskeny, tesztelhető Resend adapter.
- `scripts/press/send.mjs` — idempotens, címzettenkénti küldési folyamat.
- `scripts/press/cli.mjs` — `validate`, `dry-run` és `send` parancsok.
- `press/README.md` — operációs leírás és biztonsági kapuk.
- `press/campaign.example.json` — titok- és valódi címzett nélküli minta.
- `test/press-contracts.test.ts` — adatszerződés tesztjei.
- `test/press-render.test.ts` — perszonalizáció és emailrender tesztjei.
- `test/press-send.test.ts` — idempotencia, részleges hiba és maximum 30 címzett.
- `test/press-cli.test.ts` — dry-run/send kapu integrációs tesztjei.

### Gitignore-olt kampányfájlok

- `press/private/2026-spob/recipients.json` — ellenőrzött címzettek és források.
- `press/private/2026-spob/facts.md` — tény- és forrásjegyzék.
- `press/private/2026-spob/claim-map.json` — nem-fikciós claim map.
- `press/private/2026-spob/engine-packet.json` — privát `peter-irta` evidence packet.
- `press/private/2026-spob/release.md` — jóváhagyott helyi szövegpillanatkép.
- `press/private/2026-spob/campaign.json` — küldési konfiguráció.
- `press/private/2026-spob/hero.jpg` — optimalizált csatolmány.
- `press/private/2026-spob/send-log.jsonl` — lokális idempotencianapló.
- `press/output/2026-spob/` — renderelt előnézetek, riportok, DOCX/PDF exportok.

---

### Task 1: Privát kampányhatár és adatszerződések

**Files:**
- Modify: `.gitignore`
- Create: `scripts/press/contracts.mjs`
- Create: `press/campaign.example.json`
- Create: `test/press-contracts.test.ts`

**Interfaces:**
- Consumes: nyers JavaScript objektumok betöltött JSON-fájlokból.
- Produces: `validateRecipient(value): ValidationResult`, `validateCampaign(value): ValidationResult`, ahol `ValidationResult = { ok: true, value: object } | { ok: false, errors: string[] }`.

- [ ] **Step 1: Írd meg a hibás címzettet és kampányt elutasító teszteket**

```ts
import { describe, expect, it } from 'vitest';
import { validateCampaign, validateRecipient } from '../scripts/press/contracts.mjs';

describe('press contracts', () => {
  it('requires a public source and verification date for every recipient', () => {
    const result = validateRecipient({ outlet: 'Litera', email: 'szerkesztoseg@example.hu' });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('sourceUrl is required');
    expect(result.errors).toContain('verifiedAt must be YYYY-MM-DD');
  });

  it('rejects more than 30 approved recipients', () => {
    const recipients = Array.from({ length: 31 }, (_, index) => ({
      outlet: `Outlet ${index}`,
      email: `press${index}@example.hu`,
      sourceUrl: 'https://example.hu/impresszum',
      verifiedAt: '2026-08-24',
      relevance: 'Kulturális rovat',
      personalization: 'Kulturális eseményekkel foglalkozik',
      status: 'approved',
    }));
    const campaign = {
      campaignId: '2026-spob',
      from: 'Slam Poetry Magyarország <media@slampoetry.hu>',
      replyTo: 'media@slampoetry.hu',
      releasePath: 'press/private/2026-spob/release.md',
      pressKitUrl: 'https://drive.google.com/drive/folders/example',
      attachmentPath: 'press/private/2026-spob/hero.jpg',
      approvedQuote: false,
      recipients,
    };
    expect(validateCampaign(campaign).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Futtasd a tesztet, és ellenőrizd a várt hibát**

Run: `npx vitest run test/press-contracts.test.ts`

Expected: FAIL, mert a `contracts.mjs` még nem létezik.

- [ ] **Step 3: Implementáld a minimális explicit szerződéseket**

```js
export function validateRecipient(value) {
  const errors = [];
  if (!value?.outlet?.trim()) errors.push('outlet is required');
  if (!/^\S+@\S+\.\S+$/.test(value?.email ?? '')) errors.push('email is invalid');
  if (!/^https:\/\//.test(value?.sourceUrl ?? '')) errors.push('sourceUrl is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value?.verifiedAt ?? '')) errors.push('verifiedAt must be YYYY-MM-DD');
  if (!value?.relevance?.trim()) errors.push('relevance is required');
  if (!value?.personalization?.trim()) errors.push('personalization is required');
  if (!['planned', 'approved', 'excluded'].includes(value?.status)) errors.push('status is invalid');
  return errors.length ? { ok: false, errors } : { ok: true, value };
}
```

Az `validateCampaign` ellenőrizze a `campaignId`, `from`, `replyTo`, `releasePath`, `pressKitUrl`, `attachmentPath`, `approvedQuote`, `recipients` mezőket, a 30-as plafont és a duplikált normalizált emailcímeket.

- [ ] **Step 4: Védd le a privát adatokat a `.gitignore`-ban**

```gitignore
# local press campaign data and generated previews
press/private/
press/output/
```

- [ ] **Step 5: Futtasd a célzott és teljes tesztcsomagot**

Run: `npx vitest run test/press-contracts.test.ts`

Expected: PASS.

Run: `npm test`

Expected: az összes meglévő és új teszt PASS.

- [ ] **Step 6: Commit**

```powershell
git add .gitignore scripts/press/contracts.mjs press/campaign.example.json test/press-contracts.test.ts
git commit -m "feat(press): add private campaign contracts"
```

---

### Task 2: Ellenőrzött sajtólista és ténycsomag

**Files:**
- Create, ignored: `press/private/2026-spob/recipients.json`
- Create, ignored: `press/private/2026-spob/facts.md`
- Create, ignored: `press/private/2026-spob/campaign.json`
- Create: `scripts/press/validate.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `validateCampaign()` a Task 1-ből, privát kampány JSON.
- Produces: `validateCampaignFile(path): Promise<{ campaign: object, approvedRecipients: object[] }>` és `npm run press:validate -- --campaign press/private/2026-spob/campaign.json`.

- [ ] **Step 1: Gyűjts 35–40 jelöltet, majd rangsorold őket relevancia szerint**

Minden jelöltnél nyisd meg az orgánum saját impresszumát vagy kapcsolatoldalát. A keresőtalálat önmagában nem forrás. Rögzítsd a `sourceUrl`, `verifiedAt`, `section`, `contactName`, `relevance`, `personalization` és `status` mezőt. A végleges `approved` halmaz maximum 30 elem.

- [ ] **Step 2: Ellenőrizd külön a kötelező irodalmi célpontokat**

A Litera, Nincs Online / Nincs folyóirat és Bookline Magazin esetén dokumentáld, hogy szerkesztőségi/magazinos címről van-e szó. Kereskedelmi ügyfélszolgálatot ne jelölj `approved` státuszúnak.

- [ ] **Step 3: Készíts forrásalapú tényjegyzéket**

A `facts.md` minden sora ezt a mintát kövesse:

```markdown
- Claim: A KAZI-ban tartott előválogató dátuma és kezdése.
  - Value: 2026. szeptember 25., 15:00, KAZI
  - Source: https://slampoetry.hu/esemenyek/14-spob-elovalogato-kazi
  - Verified: 2026-08-24
  - Confidence: confirmed
```

Külön ellenőrizd az eseményadatokat, a jelentkezési határidőt, az 1986-os nemzetközi és a 2006-os magyar történeti állítást. Ellentmondó forrásnál ne válassz csendben: jelöld `conflicting` állapotúnak.

- [ ] **Step 4: Írd meg a fájlbetöltés sikertelen tesztjét, majd a validátort**

```js
import { readFile } from 'node:fs/promises';
import { validateCampaign } from './contracts.mjs';

export async function validateCampaignFile(path) {
  const value = JSON.parse(await readFile(path, 'utf8'));
  const result = validateCampaign(value);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return {
    campaign: result.value,
    approvedRecipients: result.value.recipients.filter((item) => item.status === 'approved'),
  };
}
```

- [ ] **Step 5: Adj hozzá kizárólag lokális scriptsorokat**

```json
{
  "press:validate": "node scripts/press/cli.mjs validate",
  "press:dry-run": "node scripts/press/cli.mjs dry-run",
  "press:send": "node scripts/press/cli.mjs send"
}
```

- [ ] **Step 6: Validáld a privát listát és ellenőrizd, hogy ignorált maradt**

Run: `npm run press:validate -- --campaign press/private/2026-spob/campaign.json`

Expected: exit 0, legfeljebb 30 approved recipient.

Run: `git status --short --ignored press/private press/output`

Expected: a privát kampányfájlok `!!` jelöléssel ignoráltak.

- [ ] **Step 7: Commit csak a kódot**

```powershell
git add scripts/press/validate.mjs package.json package-lock.json
git commit -m "feat(press): validate local campaign files"
```

---

### Task 3: `peter-irta` retrieval, claim map és sajtóközlemény-draft

**Files:**
- Create, ignored: `press/private/2026-spob/engine-packet.json`
- Create, ignored: `press/private/2026-spob/claim-map.json`
- Create, ignored: `press/private/2026-spob/release.md`
- Create, ignored: `press/private/2026-spob/stance-map.json`

**Interfaces:**
- Consumes: `facts.md`, a jóváhagyott designspec és a `peter-irta` skill.
- Produces: forrásellenőrzött, 300–500 szavas `release.md`, sikeres style/claim/stance ellenőrzéssel.

- [ ] **Step 1: Futtasd az Engine v3-at cikkes műfajban**

```powershell
python -X utf8 "C:\Users\Mészáros Péter\.codex\skills\peter-irta\scripts\mind_vault_engine.py" `
  --brief "Sajtóközlemény a 2026-os Slam Poetry Országos Bajnokság előválogatóiról, a magyar slam húszéves és a nemzetközi műfaj negyvenéves történeti keretével. A hír a jelentkezés; a jubileum a kulturális jelentés. Pontos, átvehető, 300–500 szavas cikkes hang, mini slam és jubileumi pátosz nélkül." `
  --genre cikk `
  --audience "magyar kulturális, irodalmi, országos és regionális szerkesztők" `
  --output "press/private/2026-spob/engine-packet.json"
```

- [ ] **Step 2: Ellenőrizd az evidence packetet**

Olvasd vissza a `retrieval.confidence`, `channels`, `preference_reranker` és `evidence_compiler` részeket. `cold-start` esetén ne állíts tanult preferenciát. A kiválasztásnak legalább 8 eltérő műcsaládot kell feltérképeznie, majd 3–5 briefhez illő mechanikát kell használnia.

- [ ] **Step 3: Készíts claim mapet és stance mapet**

```json
{
  "claims": [
    {
      "text": "A magyar slam poetry 2026-ban húszéves.",
      "label": "brief-supplied",
      "source_ids": []
    }
  ]
}
```

Minden esemény-, történeti és szervezeti állítás kerüljön a claim mapbe. A `stance-map.json` hat mezője a `personal_stake`, `claim`, `not_claiming`, `strongest_counterargument`, `where_counterargument_is_right`, `perspective_turn` legyen.

- [ ] **Step 4: Írd meg a fordított piramisú draftot**

A `release.md` pontosan a spec 5. fejezetének 12 elemű struktúráját kövesse. Vajna Balázs idézete elé kerüljön `JÓVÁHAGYÁSRA VÁRÓ IDÉZET`, amíg nincs elfogadva.

- [ ] **Step 5: Futtasd a `peter-irta` minőségi kapukat**

```powershell
python -X utf8 "C:\Users\Mészáros Péter\.codex\skills\peter-irta\scripts\draft_style_check.py" `
  --portfolio "press/private/2026-spob/engine-packet.json" `
  --draft "press/private/2026-spob/release.md"

python -X utf8 "C:\Users\Mészáros Péter\.codex\skills\peter-irta\scripts\claim_gate.py" `
  --draft "press/private/2026-spob/release.md" `
  --portfolio "press/private/2026-spob/engine-packet.json" `
  --claim-map "press/private/2026-spob/claim-map.json" `
  --mode nonfiction

python -X utf8 "C:\Users\Mészáros Péter\.codex\skills\peter-irta\scripts\stance_map_check.py" `
  --map "press/private/2026-spob/stance-map.json"
```

Expected: mindhárom parancs exit 0. Hard fail esetén javítsd a draftot, ne kerüld meg a kaput.

- [ ] **Step 6: Kérj tartalmi és idézetjóváhagyást**

Mutasd meg Péternek a teljes draftot, a tényforrásokat és külön Vajna Balázs idézetét. Ez a feladat nem léphet tovább a küldési csomag fagyasztására explicit jóváhagyás nélkül.

---

### Task 4: Natív Google Docs munkadokumentum és lezárt exportok

**Files:**
- Create, ignored: `press/private/2026-spob/google-doc.json`
- Create, ignored: `press/output/2026-spob/press-release.docx`
- Create, ignored: `press/output/2026-spob/press-release.pdf`

**Interfaces:**
- Consumes: jóváhagyásra kész `release.md`, tárgysorok, források, sajtókapcsolat.
- Produces: natív Google Docs URL/document ID/revision ID, majd vizuálisan ellenőrzött DOCX és PDF pillanatkép.

- [ ] **Step 1: Olvasd el a Google Docs skill blank-native és citation útvonalának kötelező referenciáit**

Olvasandó: `reference-native-create-direct.md`, `reference-direct-request-composition.md`, `reference-smart-chips-and-building-blocks.md`, `reference-citations-and-hyperlinks.md`, `reference-section-completeness-and-final-pass.md`, `reference-pdf-export-visual-qa.md`.

- [ ] **Step 2: Hozd létre a natív Google Docs dokumentumot**

Cím: `Slam Poetry OB 2026 — sajtóközlemény és kiküldési anyagok`

Szekciók: `Sajtóközlemény`, `Jóváhagyandó idézet`, `Tárgysorok`, `Sajtókapcsolat`, `Források és szerkesztői jegyzetek`.

- [ ] **Step 3: Olvasd vissza a tab- és revision-azonosítókat, majd írj revision guarddal**

A dokumentum létrehozása után teljes readback kell. A batch update minden érdemi írásnál használja a friss `requiredRevisionId` mezőt. A konkrét dátumok natív date chipek legyenek, amikor a connector ezt támogatja.

- [ ] **Step 4: Teljes visszaolvasással ellenőrizd a tartalmat**

Ellenőrizd, hogy minden kötelező szekció, link, telefonszám, forrás és jóváhagyási jelölés jelen van. A dokumentum URL-jét, ID-jét és revision ID-jét mentsd a `google-doc.json` fájlba.

- [ ] **Step 5: A jóváhagyás után exportálj DOCX-ot és PDF-et**

Az exportok a `press/output/2026-spob/` mappába kerüljenek. Az export előtt friss readbackkal bizonyítsd, hogy nincs kollaborátori konfliktus.

- [ ] **Step 6: Vizuális QA**

Rendereld a PDF oldalait, és ellenőrizd a tördelést, a linkeket, a telefonszámokat, az idézetet, a forrásblokkot és az esetleges üres oldalt. A DOCX tartalmát is olvasd vissza. Hibánál a Google Docs forrást javítsd, majd exportálj újra.

---

### Task 5: Személyre szabott HTML és plain-text renderelés

**Files:**
- Create: `scripts/press/render.mjs`
- Create: `test/press-render.test.ts`

**Interfaces:**
- Consumes: `renderPressEmail({ campaign, recipient, releaseMarkdown }): { subject: string, html: string, text: string }`.
- Produces: escaped, személyre szabott email, amely a teljes közleményt tartalmazza.

- [ ] **Step 1: Írd meg az escaping- és perszonalizációs teszteket**

```ts
import { expect, it } from 'vitest';
import { renderPressEmail } from '../scripts/press/render.mjs';

it('renders a factual outlet-specific intro and the full release', () => {
  const rendered = renderPressEmail({
    campaign: fixtureCampaign,
    recipient: {
      outlet: 'Litera',
      contactName: 'Szerkesztőség',
      personalization: 'A kortárs irodalom és az élő irodalmi kultúra miatt lehet releváns.',
    },
    releaseMarkdown: '# Hír\n\nA teljes közlemény.',
  });
  expect(rendered.text).toContain('Kedves Szerkesztőség!');
  expect(rendered.text).toContain('A teljes közlemény.');
  expect(rendered.html).not.toContain('<script>');
});
```

- [ ] **Step 2: Futtasd a tesztet, és ellenőrizd a várt hibát**

Run: `npx vitest run test/press-render.test.ts`

Expected: FAIL, mert a renderelő még nem létezik.

- [ ] **Step 3: Implementáld a kis, explicit Markdown-részhalmazt**

A renderelő csak címsort, bekezdést, egyszerű felsorolást és HTTP(S) linket támogasson. Minden szöveg HTML-escape-en menjen át. Ismeretlen Markdown-szerkezet validációs hibát adjon, ne nyers HTML-t.

- [ ] **Step 4: Implementáld a kísérőemail szerkezetét**

Sorrend: megszólítás → 2–4 mondatos orgánumspecifikus felvezetés → teljes közlemény → sajtócsomag linkje → sajtókapcsolat. Az outlet-specifikus mondatot adatból olvassa; a kód ne generáljon automatikus dicséretet.

- [ ] **Step 5: Futtasd a teszteket és commitolj**

```powershell
npx vitest run test/press-render.test.ts
npm test
git add scripts/press/render.mjs test/press-render.test.ts
git commit -m "feat(press): render personalized press emails"
```

---

### Task 6: Stabil kampányhash és Resend adapter

**Files:**
- Create: `scripts/press/hash.mjs`
- Create: `scripts/press/resend-client.mjs`
- Create: `test/press-send.test.ts`

**Interfaces:**
- Consumes: `campaignFingerprint({ campaign, approvedRecipients, releaseMarkdown }): string`.
- Produces: `createResendTransport(apiKey): { send(message): Promise<{ id: string }> }`.

- [ ] **Step 1: Írj determinisztikus hash-tesztet**

```ts
it('produces the same fingerprint regardless of recipient input order', () => {
  expect(campaignFingerprint(inputA)).toBe(campaignFingerprint(inputB));
});
```

A fingerprint a normalizált kampányazonosítót, feladót, reply-to címet, tárgysort, teljes release szöveget, press-kit URL-t és email szerint rendezett approved recipients listát fedje le.

- [ ] **Step 2: Implementáld SHA-256-tal a stabil serializálást**

```js
import { createHash } from 'node:crypto';

export function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
```

- [ ] **Step 3: Írd meg a Resend adaptert dependency injectionnel**

```js
import { Resend } from 'resend';

export function createResendTransport(apiKey) {
  const client = new Resend(apiKey);
  return {
    async send(message) {
      const { data, error } = await client.emails.send(message);
      if (error || !data?.id) throw new Error(error?.message ?? 'Resend returned no message id');
      return { id: data.id };
    },
  };
}
```

- [ ] **Step 4: Futtasd a célzott teszteket és commitolj**

```powershell
npx vitest run test/press-send.test.ts
git add scripts/press/hash.mjs scripts/press/resend-client.mjs test/press-send.test.ts
git commit -m "feat(press): add campaign fingerprint and Resend adapter"
```

---

### Task 7: Idempotens küldési motor és napló

**Files:**
- Create: `scripts/press/send.mjs`
- Modify: `test/press-send.test.ts`

**Interfaces:**
- Consumes: `sendCampaign({ campaign, recipients, releaseMarkdown, transport, logPath, delayMs, fingerprint }): Promise<SendSummary>`.
- Produces: `SendSummary = { sent: SendRecord[], skipped: SendRecord[], failed: SendRecord[] }`.

- [ ] **Step 1: Írd meg az idempotencia és részleges hiba tesztjeit**

```ts
it('skips an address already sent for the same campaign fingerprint', async () => {
  const transport = { send: vi.fn() };
  const summary = await sendCampaign({
    campaign: testCampaign,
    recipients: [testRecipient],
    releaseMarkdown: '# Sajtóközlemény\n\nTeljes szöveg.',
    transport,
    logPath,
    delayMs: 0,
    fingerprint: 'a'.repeat(64),
    existingRecords: [{
      campaignId: '2026-spob', fingerprint: 'a'.repeat(64),
      email: 'press@example.hu', status: 'sent', messageId: 'msg_1',
    }],
  });
  expect(transport.send).not.toHaveBeenCalled();
  expect(summary.skipped).toHaveLength(1);
});

it('continues after one recipient fails', async () => {
  const transport = {
    send: vi.fn()
      .mockRejectedValueOnce(new Error('temporary Resend error'))
      .mockResolvedValueOnce({ id: 'msg_2' }),
  };
  const summary = await sendCampaign({
    campaign: testCampaign,
    recipients: [testRecipient, { ...testRecipient, outlet: 'Másik lap', email: 'press2@example.hu' }],
    releaseMarkdown: '# Sajtóközlemény\n\nTeljes szöveg.',
    transport,
    logPath,
    delayMs: 0,
    fingerprint: 'b'.repeat(64),
    existingRecords: [],
  });
  expect(summary.failed).toHaveLength(1);
  expect(summary.sent).toHaveLength(1);
});
```

A tesztfájl tetején a `testCampaign`, `testRecipient` és `logPath` legyen explicit, ideiglenes mappára mutató fixture; az `afterEach` távolítsa el kizárólag ezt a teszt által létrehozott mappát.

- [ ] **Step 2: Implementáld az append-only JSONL naplót**

Minden sor mezői: `campaignId`, `fingerprint`, `email`, `outlet`, `status`, `messageId`, `timestamp`, `error`. A naplóírás minden címzett eredménye után azonnal történjen, ne csak a batch végén.

- [ ] **Step 3: Implementáld a soros küldést**

A motor kizárólag `approved` rekordokat fogadjon, minden üzenet `to` mezője pontosan egy emailcím legyen, a `from` és `replyTo` a kampányszerződésből jöjjön. A küldések között alapból 1000 ms késleltetés legyen.

- [ ] **Step 4: Csatold az egyetlen optimalizált JPEG-et**

A fájl mérete legfeljebb 1 MB lehet. A `content` base64-kódolása csak a Resend message objektum összeállításakor történjen; a base64 ne kerüljön naplóba vagy preview riportba.

- [ ] **Step 5: Futtasd a teszteket és commitolj**

```powershell
npx vitest run test/press-send.test.ts
npm test
git add scripts/press/send.mjs test/press-send.test.ts
git commit -m "feat(press): add idempotent send engine"
```

---

### Task 8: CLI, dry-run preview és kemény send kapu

**Files:**
- Create: `scripts/press/cli.mjs`
- Create: `test/press-cli.test.ts`
- Create: `press/README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `validateCampaignFile`, `campaignFingerprint`, `renderPressEmail`, `sendCampaign`.
- Produces: `runCli(argv, dependencies): Promise<number>` és a három npm-parancs.

- [ ] **Step 1: Írd meg a dry-run és send-gate teszteket**

```ts
it('dry-run never constructs a Resend transport', async () => {
  const createTransport = vi.fn();
  expect(await runCli(['dry-run', '--campaign', fixturePath], {
    createTransport,
    stdout: { write: vi.fn() },
    env: {},
  })).toBe(0);
  expect(createTransport).not.toHaveBeenCalled();
});

it('send rejects a missing or mismatched confirmation fingerprint', async () => {
  await expect(runCli(['send', '--campaign', fixturePath], {
    createTransport: vi.fn(),
    stdout: { write: vi.fn() },
    env: { RESEND_API_KEY: 'test-only-key' },
  })).rejects.toThrow('send requires --confirm followed by the 64-character campaign fingerprint');
});
```

A `fixturePath` a teszt által létrehozott ideiglenes, valid kampányfájl abszolút útvonala legyen; a teszt ne olvassa a valódi `press/private/` mappát.

- [ ] **Step 2: Implementáld a `validate` parancsot**

Kimenet: kampányazonosító, approved/planned/excluded darabszám, hiányok és duplikációk. Titkot és csatolmánybytesorozatot ne írjon ki.

- [ ] **Step 3: Implementáld a `dry-run` parancsot**

A parancs rendereljen címzettenként `.html` és `.txt` előnézetet a `press/output/2026-spob/previews/` mappába, továbbá `dry-run-report.json` és emberi `dry-run-report.md` riportot. A riport tetején jelenjen meg a teljes kampányfingerprint és a pontos, de még nem futtatandó send parancs.

- [ ] **Step 4: Implementáld a `send` parancs kemény kapuit**

A küldés csak akkor indulhat, ha egyszerre teljesül:

- a `--confirm` után átadott 64 karakteres fingerprint pontosan egyezik;
- `--campaign` explicit privát fájlra mutat;
- `RESEND_API_KEY` létezik;
- `approvedQuote === true`;
- a `release.md` nem tartalmaz `JÓVÁHAGYÁSRA VÁR`, `TBD` vagy `TODO` jelölést;
- van sikeres, azonos fingerprintű dry-run riport;
- a címzettek száma 1–30.

- [ ] **Step 5: Dokumentáld a PowerShell parancsokat**

```powershell
npm run press:validate -- --campaign "press/private/2026-spob/campaign.json"
npm run press:dry-run -- --campaign "press/private/2026-spob/campaign.json"
$fingerprint = (Get-Content -Raw "press/output/2026-spob/dry-run-report.json" | ConvertFrom-Json).fingerprint
npm run press:send -- --campaign "press/private/2026-spob/campaign.json" --confirm $fingerprint
```

A README vastagon mondja ki, hogy a harmadik parancs valódi külső emailt küld, ezért Codex csak az ugyanabban a feladatban kapott explicit kiküldési jóváhagyás után futtathatja.

- [ ] **Step 6: Futtasd a teszteket és commitolj**

```powershell
npx vitest run test/press-cli.test.ts
npm test
git add scripts/press/cli.mjs test/press-cli.test.ts press/README.md package.json package-lock.json
git commit -m "feat(press): add guarded press campaign CLI"
```

---

### Task 9: Teljes dry-run, emberi ellenőrzés és biztonságos handoff

**Files:**
- Verify, ignored: `press/private/2026-spob/*`
- Generate, ignored: `press/output/2026-spob/previews/*`
- Generate, ignored: `press/output/2026-spob/dry-run-report.md`
- Modify: `docs/codex-handoff.md`

**Interfaces:**
- Consumes: minden korábbi task kész eredménye.
- Produces: kiküldésre kész, de még el nem küldött kampány és folytatható handoff.

- [ ] **Step 1: Futtasd a teljes lokális ellenőrzést**

```powershell
npm run press:validate -- --campaign "press/private/2026-spob/campaign.json"
npm run press:dry-run -- --campaign "press/private/2026-spob/campaign.json"
npm test
npm run build
```

Expected: minden parancs exit 0. A weboldal buildje bizonyítja, hogy a lokális sajtóeszköz nem zavarta meg az alkalmazást.

- [ ] **Step 2: Ellenőrizd mind a legfeljebb 30 előnézetet**

Minden emailnél ellenőrizd a megszólítást, orgánumot, tárgysort, perszonalizációt, teljes közleményt, sajtócsomag-linket, csatolmánynevet és sajtókapcsolatot. A téves vagy erőltetett perszonalizációt javítsd a privát címzettadatban, majd generálj új dry-runt.

- [ ] **Step 3: Adj Péternek végső jóváhagyási csomagot**

A csomag tartalmazza:

- a Google Docs linkjét;
- a végleges címzettlistát;
- a tárgysorokat és perszonalizált felvezetéseket;
- a DOCX/PDF és sajtócsomag linkjét;
- a dry-run riportot;
- a fingerprintet;
- a pontos send parancsot;
- az egyértelmű mondatot: **még egyetlen email sem lett elküldve**.

- [ ] **Step 4: Frissítsd a handoffot a küldési határnál**

A `docs/codex-handoff.md` rögzítse az aktuális fingerprintet, a dry-run állapotát, a privát fájlok helyét, az utolsó teszteket és azt, hogy valódi send történt-e. Titkot, email-listát vagy telefonszámot ne másoljon a handoffba.

- [ ] **Step 5: Commit csak a trackelt handoffot, push nélkül**

```powershell
git add docs/codex-handoff.md
git commit -m "docs: hand off press campaign for approval"
git status --short --branch
```

Expected: a branch csak lokálisan van előrébb; push nem történik.

---

## Final Send Boundary

A valódi kiküldés nem része az implementáció automatikus lezárásának. A Task 9 után meg kell állni. Csak Péter új, explicit utasítása után futtatható:

```powershell
$fingerprint = (Get-Content -Raw "press/output/2026-spob/dry-run-report.json" | ConvertFrom-Json).fingerprint
npm run press:send -- --campaign "press/private/2026-spob/campaign.json" --confirm $fingerprint
```

A futás után a `send-log.jsonl` és a Resend message ID-k alapján kell jelenteni a sikeres, kihagyott és hibás címzetteket. Automatikus újrapróbálás vagy follow-up nincs.
