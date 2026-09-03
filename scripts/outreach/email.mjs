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

export const SUBJECT = 'Vasárnapig még beférsz a 14. Országos Slam Poetry Bajnokságra';

export function renderOutreachEmail({ name, applyUrl, contactEmail = 'contest@slampoetry.hu' }) {
  const hello = greeting(name);
  const btn =
    'display:inline-block;background:#b13bd6;color:#111114;text-decoration:none;' +
    'font-weight:700;font-size:17px;padding:16px 30px;border-radius:10px';

  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.65;color:#17171c;max-width:560px">
  <p style="margin:0 0 16px">${esc(hello)}</p>

  <p style="margin:0 0 16px">Ott voltál a korábbi országos bajnokságok előválogatóin, úgyhogy szólunk:
  <strong>vasárnap éjfélig még jelentkezhetsz a 14. Slam Poetry Országos Bajnokság előválogatójára.</strong></p>

  <p style="margin:0 0 16px">Az előválogatók <strong>szeptember 25-én, 26-án és 27-én</strong> lesznek.
  A jelentkezésnél megjelölöd, melyik nap felel meg neked — a végleges beosztás sorsolással alakul,
  de az igényeket lehetőség szerint figyelembe vesszük.</p>

  <p style="margin:0 0 24px">Három perc az egész: név, művésznév, melyik nap jó, és ha van, egy megjegyzés nekünk.</p>

  <p style="margin:0 0 28px"><a href="${esc(applyUrl)}" style="${btn}">Jelentkezem az előválogatóra &rarr;</a></p>

  <p style="margin:0 0 8px">Csapj oda neki!</p>
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
export function renderOutreachText({ name, applyUrl, contactEmail = 'contest@slampoetry.hu' }) {
  return `${greeting(name)}

Ott voltál a korábbi országos bajnokságok előválogatóin, úgyhogy szólunk:
vasárnap éjfélig még jelentkezhetsz a 14. Slam Poetry Országos Bajnokság előválogatójára.

Az előválogatók szeptember 25-én, 26-án és 27-én lesznek. A jelentkezésnél megjelölöd,
melyik nap felel meg neked — a végleges beosztás sorsolással alakul, de az igényeket
lehetőség szerint figyelembe vesszük.

Három perc az egész: név, művésznév, melyik nap jó, és ha van, egy megjegyzés nekünk.

Jelentkezés: ${applyUrl}

Csapj oda neki!
Slam Poetry Magyarország

---
Ezt a levelet azért kapod, mert korábban jelentkeztél az Országos Slam Poetry Bajnokság
előválogatójára. Ha nem kérsz több ilyen értesítést, írj a ${contactEmail} címre.`;
}
