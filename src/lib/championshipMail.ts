import { escapeHtml as esc } from './escape';

/**
 * A jelentkezőnek küldött automatikus visszaigazoló email törzse.
 * Külön, tiszta függvény, mert a benne szereplő adatok a jelentkezőtől jönnek — az
 * escapelés így tesztelhető, és nem keveredik a végpont vezérlési logikájával.
 */

export type SocialLinks = { facebook?: string; instagram?: string; tiktok?: string };

export const DEFAULT_SOCIAL: Required<SocialLinks> = {
  facebook: 'https://www.facebook.com/SlamPoetryHungary',
  instagram: 'https://www.instagram.com/slampoetry_magyarorszag/',
  tiktok: 'https://www.tiktok.com/@slampoetrymagyarorszag',
};

// Csak http(s) linket engedünk be a levélbe (a CMS-ből jövő érték is lehet elgépelt vagy
// `javascript:` sémájú) — hibás értéknél az ismert alapértelmezésre esünk vissza.
function safeUrl(candidate: string | undefined, fallback: string): string {
  const v = String(candidate ?? '').trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(v) ? v : fallback;
}

export function resolveSocial(social?: SocialLinks): Required<SocialLinks> {
  return {
    facebook: safeUrl(social?.facebook, DEFAULT_SOCIAL.facebook),
    instagram: safeUrl(social?.instagram, DEFAULT_SOCIAL.instagram),
    tiktok: safeUrl(social?.tiktok, DEFAULT_SOCIAL.tiktok),
  };
}

export function championshipConfirmationSubject(): string {
  return 'Megkaptuk a jelentkezésedet — Slam Poetry Magyarország';
}

export function championshipConfirmationHtml(input: {
  name?: string;
  days?: string[];
  social?: SocialLinks;
}): string {
  const s = resolveSocial(input.social);
  const name = String(input.name ?? '').trim();
  const days = (input.days ?? []).filter(Boolean);
  const link = (url: string, label: string) =>
    `<a href="${esc(url)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;background:#b13bd6;color:#111114;text-decoration:none;border-radius:8px;font-weight:600">${esc(label)}</a>`;

  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#17171c;max-width:560px">
  <h2 style="font-size:22px;margin:0 0 12px">Gratulálunk, a jelentkezésedet rögzítettük! 🎤</h2>
  <p>${name ? `Kedves ${esc(name)}!` : 'Szia!'}</p>
  <p>Köszönjük, hogy jelentkeztél az országos bajnokságra. A jelentkezésedet rögzítettük.</p>
  ${days.length ? `<p><strong>Amit megjelöltél:</strong> ${esc(days.join(', '))}</p>` : ''}
  <p>A <strong>sorsolás</strong> után — az igényeidet lehetőség szerint figyelembe véve — itt a
  weboldalunkon, valamint a Facebookon kommunikáljuk, hogy melyik csoportba kerültél.</p>
  <p>Addig is, ha még nem tetted meg, kövess be minket:</p>
  <p>${link(s.facebook, 'Facebook')}${link(s.instagram, 'Instagram')}${link(s.tiktok, 'TikTok')}</p>
  <p style="color:#5a5560;font-size:13px;margin-top:24px">Slam Poetry Magyarország · <a href="https://slampoetry.hu" style="color:#b13bd6">slampoetry.hu</a></p>
</div>`;
}
