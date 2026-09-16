import { greeting } from './lib.mjs';
import { esc } from './email.mjs';

/**
 * A XIV. SPOB előválogatóira jelentkezőknek szóló levél: melyik napra kerültek.
 * A napok névsora a weboldalon lévő hírben van, ezért oda mutatunk.
 */

export const SUBJECT = 'Megvan, melyik napon lépsz színpadra (XIV. SPOB előválogató)';

export const ARTICLE_URL = 'https://slampoetry.hu/hirek/xiv-spob-elovalogatok-nevsor';
export const EVENT_URL = 'https://www.facebook.com/events/864586666381482/';

/** Megszólítás: a saját nevén, ha megadta és névnek látszik; egyébként semlegesen. */
export function groupGreeting(name) {
  const g = greeting(name);
  return g === 'Szia!' ? 'Kedves OB-előválogatóra jelentkező!' : g;
}

export function renderGroupsEmail({ name, articleUrl = ARTICLE_URL, eventUrl = EVENT_URL, contactEmail = 'contest@slampoetry.hu' }) {
  const btn =
    'display:inline-block;background:#b13bd6;color:#111114;text-decoration:none;' +
    'font-weight:700;font-size:17px;padding:16px 30px;border-radius:10px';
  const btnSecondary =
    'display:inline-block;background:#ffffff;color:#b13bd6;text-decoration:none;' +
    'border:2px solid #b13bd6;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px';

  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.65;color:#17171c;max-width:600px">
  <p style="margin:0 0 16px">${esc(groupGreeting(name))}</p>

  <p style="margin:0 0 16px">Vége a sorsolásnak: <strong>megvannak a XIV. SPOB előválogatóinak kalapjai.</strong>
  Három nap, három blokk, 82 versenyző.</p>

  <p style="margin:0 0 24px">Az alábbi oldalon megnézheted, melyik napra kerültél:</p>

  <p style="margin:0 0 28px;text-align:center"><a href="${esc(articleUrl)}" style="${btn}">Megnézem, melyik napon lépek fel &rarr;</a></p>

  <p style="margin:0 0 16px"><strong>Minden napon egy csoport versenyez.</strong> Kérünk, hogy az adott napon
  <strong>legkésőbb 18:00-ig érkezz meg.</strong> Ha késnél, 19:00 előtt jelezd nekünk. A verseny 19:00-kor kezdődik.</p>

  <p style="margin:0 0 16px">A napon belüli fellépési sorrendet a helyszínen döntjük el, kalapból húzással.</p>

  <p style="margin:0 0 28px">Helyszín: KAZI, 1075 Budapest, Kazinczy utca 34. További részletek az eseményben:</p>

  <p style="margin:0 0 28px;text-align:center"><a href="${esc(eventUrl)}" style="${btnSecondary}">Az esemény a Facebookon &rarr;</a></p>

  <p style="margin:0 0 8px">Sok sikert, már csak pár nap!</p>
  <p style="margin:0 0 24px">Slam Poetry Magyarország</p>

  <hr style="border:0;border-top:1px solid #e4e4e7;margin:0 0 12px">
  <p style="color:#5a5560;font-size:12px;margin:0">
    Ezt a levelet azért kapod, mert jelentkeztél a XIV. Slam Poetry Országos Bajnokság előválogatójára.
    Kérdésed van? Írj a <a href="mailto:${esc(contactEmail)}" style="color:#5a5560">${esc(contactEmail)}</a> címre.
  </p>
</div>`;
}

export function renderGroupsText({ name, articleUrl = ARTICLE_URL, eventUrl = EVENT_URL, contactEmail = 'contest@slampoetry.hu' }) {
  return `${groupGreeting(name)}

Vége a sorsolásnak: megvannak a XIV. SPOB előválogatóinak kalapjai.
Három nap, három blokk, 82 versenyző.

Itt megnézheted, melyik napra kerültél:
${articleUrl}

Minden napon egy csoport versenyez. Kérünk, hogy az adott napon legkésőbb 18:00-ig
érkezz meg. Ha késnél, 19:00 előtt jelezd nekünk. A verseny 19:00-kor kezdődik.

A napon belüli fellépési sorrendet a helyszínen döntjük el, kalapból húzással.

Helyszín: KAZI, 1075 Budapest, Kazinczy utca 34.
További részletek az eseményben: ${eventUrl}

Sok sikert, már csak pár nap!
Slam Poetry Magyarország

---
Ezt a levelet azért kapod, mert jelentkeztél a XIV. Slam Poetry Országos Bajnokság
előválogatójára. Kérdésed van? Írj a ${contactEmail} címre.`;
}
