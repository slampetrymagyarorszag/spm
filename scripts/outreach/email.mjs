import { greeting } from './lib.mjs';

/** HTML-escape — a nevek a régi táblákból jönnek, nem bízunk bennük vakon. */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const SUBJECT = 'Vasárnap éjfélkor zárul a jelentkezés (14. OB)';

/** Az esemény hivatalos plakátja és Facebook-eseménye. */
export const BANNER_URL = 'https://slampoetry.hu/ob14-elovalogatok.jpg';
export const EVENT_URL = 'https://www.facebook.com/events/864586666381482/';
const BANNER_ALT =
  'XIV. Slam Poetry Országos Bajnokság — Előválogatók, 2026. szeptember 25-26-27., 18:00, KAZI';

export function renderOutreachEmail({
  name,
  applyUrl,
  contactEmail = 'contest@slampoetry.hu',
  bannerUrl = BANNER_URL,
  eventUrl = EVENT_URL,
}) {
  const hello = greeting(name);
  // Az elsődleges (kitöltött) gomb a jelentkezés. Az esemény másodlagos, kontúros gombot
  // kap, hogy a két hívás ne versenyezzen egymással.
  const btn =
    'display:inline-block;background:#b13bd6;color:#111114;text-decoration:none;' +
    'font-weight:700;font-size:17px;padding:16px 30px;border-radius:10px';
  const btnSecondary =
    'display:inline-block;background:#ffffff;color:#b13bd6;text-decoration:none;' +
    'border:2px solid #b13bd6;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px';

  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.65;color:#17171c;max-width:600px">
  <a href="${esc(eventUrl)}" style="display:block;margin:0 0 24px">
    <img src="${esc(bannerUrl)}" alt="${esc(BANNER_ALT)}" width="600"
         style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:10px">
  </a>

  <p style="margin:0 0 16px">${esc(hello)}</p>

  <p style="margin:0 0 16px">Ott voltál valamelyik korábbi országos bajnokság előválogatóján, úgyhogy nem hagyunk ki:
  <strong>a 14. OB jelentkezése vasárnap éjfélkor zár. Jelentkezz!</strong></p>

  <p style="margin:0 0 16px">Az előválogatók <strong>szeptember 25-én, 26-án és 27-én</strong> lesznek.
  Bejelölöd, melyik nap jó neked, a beosztás pedig sorsolással dől el. A kéréseket igyekszünk
  figyelembe venni, de a végén a kalap dönt.</p>

  <p style="margin:0 0 24px">A kitöltés rövidebb, mint amennyit egy szóviccen szoktál agyalni:
  név, művésznév, a neked megfelelő napok, és ha üzennél valamit, egy megjegyzés.</p>

  <p style="margin:0 0 28px;text-align:center"><a href="${esc(applyUrl)}" style="${btn}">Jelentkezem az előválogatóra &rarr;</a></p>

  <p style="margin:0 0 16px">Helyszín a KAZI (1075 Budapest, Kazinczy utca 34.), kezdés minden nap 18:00.</p>

  <p style="margin:0 0 28px;text-align:center"><a href="${esc(eventUrl)}" style="${btnSecondary}">Megnézem a Facebook-eseményt &rarr;</a></p>

  <p style="margin:0 0 8px">Ha van a fiókodban egy szöveg, ami már rég színpadot keres, ez az a hét.</p>
  <p style="margin:0 0 24px">Slam Poetry Magyarország</p>

  <hr style="border:0;border-top:1px solid #e4e4e7;margin:0 0 12px">
  <p style="color:#5a5560;font-size:12px;margin:0">
    Ezt a levelet azért kapod, mert korábban jelentkeztél az Országos Slam Poetry Bajnokság előválogatójára.
    Ha nem kérsz több ilyen értesítést, írj a
    <a href="mailto:${esc(contactEmail)}?subject=Leiratkoz%C3%A1s" style="color:#5a5560">${esc(contactEmail)}</a>
    címre, és azonnal töröljük a listáról.
  </p>
</div>`;
}

/** Egyszerű szöveges változat — a levelezők egy része ezt mutatja, és jobb a kézbesíthetőség. */
export function renderOutreachText({
  name,
  applyUrl,
  contactEmail = 'contest@slampoetry.hu',
  eventUrl = EVENT_URL,
}) {
  return `${greeting(name)}

Ott voltál valamelyik korábbi országos bajnokság előválogatóján, úgyhogy nem hagyunk ki:
a 14. OB jelentkezése vasárnap éjfélkor zár. Jelentkezz!

Az előválogatók szeptember 25-én, 26-án és 27-én lesznek. Bejelölöd, melyik nap jó neked,
a beosztás pedig sorsolással dől el. A kéréseket igyekszünk figyelembe venni, de a végén
a kalap dönt.

A kitöltés rövidebb, mint amennyit egy szóviccen szoktál agyalni: név, művésznév,
a neked megfelelő napok, és ha üzennél valamit, egy megjegyzés.

Jelentkezés: ${applyUrl}

Helyszín a KAZI (1075 Budapest, Kazinczy utca 34.), kezdés minden nap 18:00.
Az esemény a Facebookon: ${eventUrl}

Ha van a fiókodban egy szöveg, ami már rég színpadot keres, ez az a hét.
Slam Poetry Magyarország

---
Ezt a levelet azért kapod, mert korábban jelentkeztél az Országos Slam Poetry Bajnokság
előválogatójára. Ha nem kérsz több ilyen értesítést, írj a ${contactEmail} címre.`;
}
