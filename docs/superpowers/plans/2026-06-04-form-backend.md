# Slam Poetry MO — 3. terv: Űrlap-backend + bajnokság CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A jelentkezési és kapcsolati űrlapok élesítése egy serverless végponttal (Vercel) + Resend email-küldéssel a `contest@slampoetry.hu`-ra, valamint a `siteSettings`-ből vezérelt „országos bajnokság" CTA gomb.

**Architecture:** Az Astro alapból statikus marad; a `@astrojs/vercel` adapterrel néhány route **on-demand** (server) lesz (`export const prerender = false`). Az `/api/contact` és `/api/registration` POST-végpontok validálnak (honeypot + mezők), majd a `src/lib/mailer.ts` (Resend) emailt küld. A jelentkezésnél a címzettet a szerver az esemény Sanity-dokumentumából olvassa ki (nem a kliensből — biztonság). Az űrlapok progresszív `fetch`-csel küldenek. A bajnokság-CTA `siteSettings` mezőkből + `isCtaActive` időablak-logikából renderelődik.

**Tech:** `@astrojs/vercel`, `resend`, Astro endpoints, Vitest. Env: `RESEND_API_KEY`, `MAIL_FROM` (alap: `Slam Poetry <no-reply@slampoetry.hu>`), `CONTACT_EMAIL` (alap: `contest@slampoetry.hu`).

**Fontos:** az éles email-küldéshez Resend API-kulcs + a `slampoetry.hu` domain hitelesítése kell (a user adja). Kulcs hiányában a mailer egyértelmű hibát ad; a tesztek mockolják a Resend klienst (valódi email nélkül futnak).

---

## Fájlszerkezet

```
astro.config.mjs            # + @astrojs/vercel adapter
.env.example                # + RESEND_API_KEY, MAIL_FROM, CONTACT_EMAIL
src/lib/
  validation.ts             # validateSubmission (honeypot + mezők) + típus
  mailer.ts                 # Resend wrapper: sendMail()
src/sanity/lib/
  cta.ts                    # isCtaActive időablak-logika
src/pages/api/
  contact.ts                # POST: kapcsolati űrlap → email
  registration.ts           # POST: esemény-jelentkezés → email (címzett a Sanityből)
src/components/
  RegistrationForm.astro    # esemény-jelentkezési űrlap (progresszív fetch)
  ChampionshipCta.astro     # feltételes CTA gomb
test/
  validation.test.ts
  cta.test.ts
```

Érintett meglévő fájlok: `src/sanity/schemaTypes/siteSettings.ts` (CTA mezők), `src/sanity/lib/queries.ts` + `api.ts` (SiteSettings CTA mezők), `src/pages/kapcsolat.astro` (élő űrlap), `src/pages/esemenyek/[slug].astro` (RegistrationForm beillesztése), `src/pages/index.astro` (ChampionshipCta a hero-ban).

---

### Task 1: Vercel adapter + függőségek + env

**Files:** Modify `astro.config.mjs`, `.env.example`

- [ ] **Step 1: Csomagok**

Run:
```bash
npx astro add vercel --yes
npm install resend
```
Az `astro add vercel` beállítja a `@astrojs/vercel` adaptert és `output`-ot. A végső `astro.config.mjs` tartsa meg a Sanity + React + Tailwind konfigot, és adja hozzá az adaptert. Cél (igazítsd, ha az `astro add` mást ír):
```js
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV || 'development', process.cwd(), ''
);

export default defineConfig({
  adapter: vercel(),
  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      useCdn: false,
      studioBasePath: '/admin',
      studioRouterHistory: 'hash',
    }),
    react(),
  ],
  vite: { plugins: [tailwindcss()] },
});
```
> Megjegyzés: Astro 5-ben az `output` alapból `'static'`; adapterrel a `prerender = false`-szal jelölt route-ok lesznek on-demand. NE állítsd `output: 'server'`-re (akkor minden oldal SSR lenne). Ha az `astro add` beírt egy `output`-ot, ami mindent SSR-é tesz, vedd ki vagy állítsd `'static'`-ra.

- [ ] **Step 2: `.env.example` bővítése** (tartsd meg a meglévőket):
```
RESEND_API_KEY=your_resend_api_key
MAIL_FROM=Slam Poetry <no-reply@slampoetry.hu>
CONTACT_EMAIL=contest@slampoetry.hu
```
Add a helyi `.env`-hez is ugyanezeket placeholder/teszt értékkel (a `.env` gitignore-olt). A `RESEND_API_KEY` maradhat üres a teszteléshez.

- [ ] **Step 3: Build verifikáció**

Run: `npm run build`
Expected: build sikeres; a Vercel adapter `.vercel/output`-ot generál. A statikus oldalak továbbra is prerender-elnek. Add a `.gitignore`-hoz a `.vercel`-t, ha nincs benne.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: add Vercel adapter and Resend dependency"
```
(Author `Claude <noreply@anthropic.com>`; commit body vége: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

### Task 2: Validáció + mailer (TDD a validációra)

**Files:** Create `src/lib/validation.ts`, `src/lib/mailer.ts`, `test/validation.test.ts`

- [ ] **Step 1: Teszt előbb**

Create `test/validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateSubmission } from '../src/lib/validation';

describe('validateSubmission', () => {
  const ok = { name: 'Teszt Elek', email: 'teszt@example.com', message: 'Szeretnék jelentkezni.' };
  it('érvényes beküldést elfogad', () => { expect(validateSubmission(ok)).toEqual({ ok: true }); });
  it('honeypot kitöltve → spam', () => { expect(validateSubmission({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('hiányzó név → hiba', () => { expect(validateSubmission({ ...ok, name: '' }).ok).toBe(false); });
  it('rossz email → hiba', () => { expect(validateSubmission({ ...ok, email: 'nem-email' }).ok).toBe(false); });
  it('túl rövid üzenet → hiba', () => { expect(validateSubmission({ ...ok, message: 'hi' }).ok).toBe(false); });
});
```

- [ ] **Step 2: Futtasd — bukjon** (`npm test`): `../src/lib/validation` nincs.

- [ ] **Step 3: Implementáció**

Create `src/lib/validation.ts`:
```ts
export type SubmissionInput = {
  name?: string; email?: string; message?: string; phone?: string;
  website?: string; // honeypot — embernek láthatatlan, botok kitöltik
};
export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateSubmission(input: SubmissionInput): ValidationResult {
  if (input.website && input.website.trim() !== '') return { ok: false, error: 'spam' };
  if (!input.name || input.name.trim().length < 2) return { ok: false, error: 'A név megadása kötelező.' };
  if (!input.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) return { ok: false, error: 'Érvényes email cím szükséges.' };
  if (!input.message || input.message.trim().length < 5) return { ok: false, error: 'Az üzenet túl rövid.' };
  return { ok: true };
}
```

- [ ] **Step 4: Futtasd — menjen át** (`npm test`).

- [ ] **Step 5: Mailer (Resend wrapper)**

Create `src/lib/mailer.ts`:
```ts
import { Resend } from 'resend';

export type MailInput = { to: string; subject: string; html: string; replyTo?: string };

export async function sendMail({ to, subject, html, replyTo }: MailInput): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const from = import.meta.env.MAIL_FROM ?? process.env.MAIL_FROM ?? 'Slam Poetry <no-reply@slampoetry.hu>';
  if (!apiKey) {
    throw new Error('RESEND_API_KEY hiányzik — az email-küldés nincs konfigurálva.');
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html, replyTo });
  if (error) throw new Error(`Email küldési hiba: ${error.message ?? 'ismeretlen'}`);
}
```

- [ ] **Step 6: Build + commit**

Run `npm run build` (sikeres), `npm test` (validáció zöld).
```bash
git add -A
git commit -m "feat: add submission validation and Resend mailer"
```

---

### Task 3: API végpontok (contact + registration)

**Files:** Create `src/pages/api/contact.ts`, `src/pages/api/registration.ts`

- [ ] **Step 1: Kapcsolati végpont**

Create `src/pages/api/contact.ts`:
```ts
import type { APIRoute } from 'astro';
import { validateSubmission } from '../../lib/validation';
import { sendMail } from '../../lib/mailer';

export const prerender = false;

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateSubmission(data);
  if (!result.ok) {
    const status = result.error === 'spam' ? 200 : 400; // spam: csendben elnyel
    return new Response(JSON.stringify({ ok: result.error === 'spam' }), { status, headers: { 'Content-Type': 'application/json' } });
  }
  const to = import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';
  const html = `<h2>Új üzenet a weboldalról</h2>
    <p><strong>Név:</strong> ${esc(data.name)}</p>
    <p><strong>Email:</strong> ${esc(data.email)}</p>
    ${data.phone ? `<p><strong>Telefon:</strong> ${esc(data.phone)}</p>` : ''}
    <p><strong>Üzenet:</strong><br>${esc(data.message).replace(/\n/g, '<br>')}</p>`;
  try {
    await sendMail({ to, subject: 'Kapcsolati üzenet — slampoetry.hu', html, replyTo: data.email });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Az üzenet küldése sikertelen. Próbáld újra később.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
```

- [ ] **Step 2: Jelentkezési végpont (címzett a Sanityből)**

Create `src/pages/api/registration.ts`:
```ts
import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateSubmission } from '../../lib/validation';
import { sendMail } from '../../lib/mailer';

export const prerender = false;

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateSubmission(data);
  if (!result.ok) {
    const status = result.error === 'spam' ? 200 : 400;
    return new Response(JSON.stringify({ ok: result.error === 'spam' }), { status, headers: { 'Content-Type': 'application/json' } });
  }
  // A címzettet és az esemény címét a szerver olvassa ki (a kliens nem adhatja meg).
  const slug = typeof data.eventSlug === 'string' ? data.eventSlug : '';
  const fallback = import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';
  const ev = slug
    ? await sanityClient.fetch(
        `*[_type == "event" && slug.current == $slug][0]{ title, registrationEnabled, registrationEmail }`,
        { slug }
      )
    : null;
  if (!ev || ev.registrationEnabled !== true) {
    return new Response(JSON.stringify({ ok: false, error: 'Erre az eseményre nem lehet jelentkezni.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const to = ev.registrationEmail || fallback;
  const html = `<h2>Új jelentkezés: ${esc(ev.title)}</h2>
    <p><strong>Név:</strong> ${esc(data.name)}</p>
    <p><strong>Email:</strong> ${esc(data.email)}</p>
    ${data.phone ? `<p><strong>Telefon:</strong> ${esc(data.phone)}</p>` : ''}
    <p><strong>Üzenet:</strong><br>${esc(data.message).replace(/\n/g, '<br>')}</p>`;
  try {
    await sendMail({ to, subject: `Jelentkezés — ${ev.title}`, html, replyTo: data.email });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'A jelentkezés küldése sikertelen. Próbáld újra később.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
```

- [ ] **Step 3: Build + commit**

Run `npm run build` (sikeres; a két api route on-demand függvényként generálódik).
```bash
git add -A
git commit -m "feat: add contact and registration API endpoints"
```

---

### Task 4: Élő kapcsolati űrlap (progresszív fetch)

**Files:** Modify `src/pages/kapcsolat.astro`

- [ ] **Step 1: Az űrlap aktiválása**

A `kapcsolat.astro` jelenlegi `<form>`-ját cseréld erre (a kapcsolati infó-blokk maradjon):
```astro
<form id="contact-form" class="grid gap-4" aria-label="Kapcsolati űrlap">
  <input type="text" name="name" placeholder="Neved" aria-label="Neved" required class="rounded-lg border border-ink/15 px-4 py-3" />
  <input type="email" name="email" placeholder="Email címed" aria-label="Email címed" required class="rounded-lg border border-ink/15 px-4 py-3" />
  <textarea name="message" rows="5" placeholder="Üzenet" aria-label="Üzenet" required class="rounded-lg border border-ink/15 px-4 py-3"></textarea>
  <input type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />
  <button type="submit" class="rounded-lg bg-accent px-5 py-3 font-semibold text-ink hover:opacity-90">Küldés</button>
  <p id="contact-status" class="text-sm" role="status" aria-live="polite"></p>
</form>
<script>
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const status = document.getElementById('contact-status');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form || !status) return;
    const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
    btn.disabled = true; status.textContent = 'Küldés…'; status.style.color = '';
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (res.ok && json.ok) { status.textContent = 'Köszönjük! Üzeneted megérkezett.'; status.style.color = 'green'; form.reset(); }
      else { status.textContent = json.error ?? 'Hiba történt.'; status.style.color = 'crimson'; }
    } catch { status.textContent = 'Hálózati hiba. Próbáld újra.'; status.style.color = 'crimson'; }
    finally { btn.disabled = false; }
  });
</script>
```

- [ ] **Step 2: Build + commit**

Run `npm run build` (sikeres).
```bash
git add -A
git commit -m "feat: wire live contact form to API"
```

---

### Task 5: Esemény-jelentkezési űrlap

**Files:** Create `src/components/RegistrationForm.astro`; Modify `src/pages/esemenyek/[slug].astro`

- [ ] **Step 1: RegistrationForm komponens**

Create `src/components/RegistrationForm.astro`:
```astro
---
interface Props { eventSlug: string; deadline?: string }
const { eventSlug, deadline } = Astro.props;
---
<div class="my-8 rounded-lg border border-accent/40 bg-accent/5 p-5">
  <h2 class="font-display text-xl">Jelentkezés</h2>
  {deadline && <p class="mt-1 text-sm text-muted">Határidő: {new Date(deadline).toLocaleDateString('hu-HU')}</p>}
  <form id="reg-form" class="mt-4 grid gap-3" aria-label="Jelentkezési űrlap" data-event={eventSlug}>
    <input type="text" name="name" placeholder="Neved" aria-label="Neved" required class="rounded-lg border border-ink/15 px-4 py-3" />
    <input type="email" name="email" placeholder="Email címed" aria-label="Email címed" required class="rounded-lg border border-ink/15 px-4 py-3" />
    <input type="tel" name="phone" placeholder="Telefon (opcionális)" aria-label="Telefon" class="rounded-lg border border-ink/15 px-4 py-3" />
    <textarea name="message" rows="4" placeholder="Pár szó magadról / a produkcióról" aria-label="Üzenet" required class="rounded-lg border border-ink/15 px-4 py-3"></textarea>
    <input type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />
    <button type="submit" class="rounded-lg bg-accent px-5 py-3 font-semibold text-ink hover:opacity-90">Jelentkezem</button>
    <p id="reg-status" class="text-sm" role="status" aria-live="polite"></p>
  </form>
</div>
<script>
  const form = document.getElementById('reg-form') as HTMLFormElement | null;
  const status = document.getElementById('reg-status');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form || !status) return;
    const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
    btn.disabled = true; status.textContent = 'Küldés…'; status.style.color = '';
    const payload = { ...Object.fromEntries(new FormData(form).entries()), eventSlug: form.dataset.event };
    try {
      const res = await fetch('/api/registration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (res.ok && json.ok) { status.textContent = 'Köszönjük a jelentkezést!'; status.style.color = 'green'; form.reset(); }
      else { status.textContent = json.error ?? 'Hiba történt.'; status.style.color = 'crimson'; }
    } catch { status.textContent = 'Hálózati hiba. Próbáld újra.'; status.style.color = 'crimson'; }
    finally { btn.disabled = false; }
  });
</script>
```

- [ ] **Step 2: Beillesztés az esemény-oldalba**

In `src/pages/esemenyek/[slug].astro`, replace the existing registration display block (the `{ev.registrationEnabled && (... display-only div ...)}`) with the form component. Add the import `import RegistrationForm from '../../components/RegistrationForm.astro';` and render:
```astro
{ev.registrationEnabled && <RegistrationForm eventSlug={ev.slug} deadline={ev.registrationDeadline} />}
```

- [ ] **Step 3: Build + commit**

Run `npm run build` (sikeres).
```bash
git add -A
git commit -m "feat: add event registration form posting to API"
```

---

### Task 6: Országos bajnokság CTA

**Files:** Modify `src/sanity/schemaTypes/siteSettings.ts`, `src/sanity/lib/queries.ts`, `src/sanity/lib/api.ts`, `src/pages/index.astro`; Create `src/sanity/lib/cta.ts`, `src/components/ChampionshipCta.astro`, `test/cta.test.ts`

- [ ] **Step 1: siteSettings CTA mezők**

In `src/sanity/schemaTypes/siteSettings.ts`, add these fields (a `contactEmail` után):
```ts
    defineField({ name: 'championshipCtaEnabled', title: 'Országos bajnokság CTA — bekapcsolva', type: 'boolean', initialValue: false }),
    defineField({ name: 'championshipCtaLabel', title: 'CTA felirat', type: 'string', initialValue: 'Jelentkezem az országos bajnokságra' }),
    defineField({ name: 'championshipCtaUrl', title: 'CTA cél (URL vagy /esemenyek/slug)', type: 'string' }),
    defineField({ name: 'championshipCtaFrom', title: 'CTA megjelenés -tól', type: 'datetime' }),
    defineField({ name: 'championshipCtaTo', title: 'CTA megjelenés -ig', type: 'datetime' }),
```

- [ ] **Step 2: CTA időablak-logika — TDD**

Create `test/cta.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isCtaActive } from '../src/sanity/lib/cta';
const now = new Date('2026-10-15T12:00:00Z');
describe('isCtaActive', () => {
  it('kikapcsolva → false', () => { expect(isCtaActive({ championshipCtaEnabled: false }, now)).toBe(false); });
  it('bekapcsolva, ablak nélkül → true', () => { expect(isCtaActive({ championshipCtaEnabled: true }, now)).toBe(true); });
  it('ablak előtt → false', () => { expect(isCtaActive({ championshipCtaEnabled: true, championshipCtaFrom: '2026-11-01T00:00:00Z' }, now)).toBe(false); });
  it('ablak után → false', () => { expect(isCtaActive({ championshipCtaEnabled: true, championshipCtaTo: '2026-10-01T00:00:00Z' }, now)).toBe(false); });
  it('ablakon belül → true', () => { expect(isCtaActive({ championshipCtaEnabled: true, championshipCtaFrom: '2026-10-01T00:00:00Z', championshipCtaTo: '2026-11-01T00:00:00Z' }, now)).toBe(true); });
});
```
Run `npm test` → FAIL (nincs cta modul). Then create `src/sanity/lib/cta.ts`:
```ts
export type CtaSettings = {
  championshipCtaEnabled?: boolean;
  championshipCtaFrom?: string;
  championshipCtaTo?: string;
};
export function isCtaActive(s: CtaSettings, now: Date = new Date()): boolean {
  if (!s.championshipCtaEnabled) return false;
  if (s.championshipCtaFrom && now < new Date(s.championshipCtaFrom)) return false;
  if (s.championshipCtaTo && now > new Date(s.championshipCtaTo)) return false;
  return true;
}
```
Run `npm test` → PASS (5 új teszt).

- [ ] **Step 3: SiteSettings típus + query bővítés**

In `src/sanity/lib/queries.ts` `SITE_SETTINGS_QUERY` projekcióját bővítsd:
```
  championshipCtaEnabled, championshipCtaLabel, championshipCtaUrl, championshipCtaFrom, championshipCtaTo
```
(vesszővel a meglévők mellé, a `social` után).
In `src/sanity/lib/api.ts` a `SiteSettings` típushoz add:
```ts
  championshipCtaEnabled?: boolean;
  championshipCtaLabel?: string;
  championshipCtaUrl?: string;
  championshipCtaFrom?: string;
  championshipCtaTo?: string;
```

- [ ] **Step 4: ChampionshipCta komponens**

Create `src/components/ChampionshipCta.astro`:
```astro
---
import type { SiteSettings } from '../sanity/lib/api';
import { isCtaActive } from '../sanity/lib/cta';
interface Props { settings: SiteSettings }
const { settings } = Astro.props;
const active = isCtaActive(settings);
const label = settings.championshipCtaLabel ?? 'Jelentkezem az országos bajnokságra';
const url = settings.championshipCtaUrl ?? '/esemenyek';
---
{active && (
  <a href={url} class="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-ink shadow-lg hover:opacity-90">
    🎤 {label}
  </a>
)}
```

- [ ] **Step 5: Beillesztés a főoldal hero-ba**

In `src/pages/index.astro`, fetch siteSettings and render the CTA in the hero CTA row. Add to the frontmatter: `import ChampionshipCta from '../components/ChampionshipCta.astro';` and `import { getSiteSettings } from '../sanity/lib/api';` then `const settings = (await getSiteSettings(sanityClient)) ?? { title: 'Slam Poetry Magyarország' };`. In the hero's button row (after the two existing links), add:
```astro
<ChampionshipCta settings={settings} />
```

- [ ] **Step 6: Build + tesztek + commit**

Run `npm run build` (sikeres), `npm test` (cta tesztek zöld).
```bash
git add -A
git commit -m "feat: add championship CTA controlled by siteSettings with date window"
```

---

### Task 7: Teljes verifikáció

- [ ] **Step 1: Végpont-teszt dev szerveren**

Indíts `npm run dev`-et. Egy terminálban:
```bash
curl -s -X POST http://localhost:4321/api/contact -H "Content-Type: application/json" -d '{"website":"bot"}'
```
Expected: `{"ok":true}` (honeypot csendben elnyeli), HTTP 200.
```bash
curl -s -X POST http://localhost:4321/api/contact -H "Content-Type: application/json" -d '{"name":"A","email":"rossz","message":"rövid"}'
```
Expected: HTTP 400, validációs hiba.
```bash
curl -s -X POST http://localhost:4321/api/contact -H "Content-Type: application/json" -d '{"name":"Teszt Elek","email":"teszt@example.com","message":"Ez egy valódi teszt üzenet."}'
```
Expected (RESEND_API_KEY nélkül): HTTP 500, `{"ok":false,"error":"Az üzenet küldése sikertelen..."}` — ez VÁRT a kulcs hiányában; a validáció átment, csak a küldés nincs konfigurálva. (Kulccsal HTTP 200 lenne.)

- [ ] **Step 2: Tesztek + build**

`npm test` (összes zöld: korábbiak + validation + cta), `npm run build` sikeres.

- [ ] **Step 3: Commit (ha volt módosítás)**
```bash
git add -A
git commit -m "chore: verify form endpoints and CTA"
```

---

## Self-Review

- **Spec-lefedettség:** Vercel adapter + Resend (Task 1–2) ✓; kapcsolati végpont + űrlap (Task 3–4) ✓; esemény-jelentkezés végpont + űrlap, címzett a Sanityből (Task 3, 5) ✓; honeypot + validáció (Task 2) ✓; bajnokság-CTA siteSettings-ből, időablakkal (Task 6) ✓.
- **Placeholder-ellenőrzés:** nincs TBD; minden lépés kód/parancs. A `RESEND_API_KEY` üres értéke szándékos (a user adja); a végpont egyértelmű 500-at ad kulcs nélkül.
- **Biztonság:** a jelentkezés címzettjét a szerver olvassa a Sanityből (nem a kliens); HTML-escape az email-tartalomban; honeypot a spam ellen. (Rate-limit serverless-en állapot nélkül nehéz — későbbi bővítés, pl. captcha vagy edge KV.)
- **Típus-konzisztencia:** `SubmissionInput`/`ValidationResult` egységes; `SiteSettings` CTA mezői a query-vel és az `isCtaActive` `CtaSettings`-ével egyeznek.

## Függőség / a usernek

- **Resend:** fiók + API-kulcs (`RESEND_API_KEY`) és a `slampoetry.hu` domain hitelesítése (SPF/DKIM) az éles email-küldéshez. A `MAIL_FROM` feladó a hitelesített domainen legyen.
- **Vercel:** projekt + a fenti env változók beállítása a Vercel dashboardon a deployhoz (4. terv/később).
