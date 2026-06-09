export type SubmissionInput = {
  name?: string; email?: string; message?: string; phone?: string;
  eventSlug?: string; // esemény-jelentkezésnél: a szerver ebből keresi ki a címzettet
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

// Esemény-tipp beküldés: a látogató jelez egy eseményt, ami nincs a naptárban.
// Kötelező: rendezvény neve, rövid leírás, Facebook esemény link. Email opcionális.
export type EventTipInput = {
  eventName?: string;
  description?: string;
  facebookUrl?: string;
  email?: string; // opcionális — ha vissza akarunk jelezni
  website?: string; // honeypot
};

export function validateEventTip(input: EventTipInput): ValidationResult {
  if (input.website && input.website.trim() !== '') return { ok: false, error: 'spam' };
  if (!input.eventName || input.eventName.trim().length < 2) return { ok: false, error: 'A rendezvény nevének megadása kötelező.' };
  if (!input.description || input.description.trim().length < 5) return { ok: false, error: 'Kérünk egy rövid leírást az eseményről.' };
  if (!input.facebookUrl || !/^https?:\/\/\S+$/i.test(input.facebookUrl.trim())) return { ok: false, error: 'Érvényes esemény-link szükséges (https://…).' };
  if (input.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) return { ok: false, error: 'Az email cím nem érvényes.' };
  return { ok: true };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Slammer-önjelentkezés: a látogató kéri, hogy felkerüljön a slammer-listára.
// Kötelező: név, művésznév, leírás, YouTube link. (A fotót a multipart törzs viszi.)
export type SlammerApplicationInput = {
  realName?: string;
  stageName?: string;
  description?: string;
  youtubeUrl?: string;
  email?: string; // opcionális
  consent?: unknown; // a moderációs nyilatkozat elfogadása (kötelező)
  website?: string; // honeypot
};

export function validateSlammerApplication(input: SlammerApplicationInput): ValidationResult {
  if (input.website && String(input.website).trim() !== '') return { ok: false, error: 'spam' };
  if (!input.realName || input.realName.trim().length < 2) return { ok: false, error: 'A neved megadása kötelező.' };
  if (!input.stageName || input.stageName.trim().length < 2) return { ok: false, error: 'A művészneved megadása kötelező.' };
  if (!input.description || input.description.trim().length < 10) return { ok: false, error: 'Kérünk egy rövid bemutatkozást (legalább pár szó).' };
  if (!input.youtubeUrl || !/^https?:\/\/\S+$/i.test(input.youtubeUrl.trim())) return { ok: false, error: 'Érvényes YouTube link szükséges (https://…).' };
  if (input.email && !EMAIL_RE.test(input.email)) return { ok: false, error: 'Az email cím nem érvényes.' };
  if (!isConsented(input.consent)) return { ok: false, error: 'A beküldéshez el kell fogadnod a moderációs feltételeket.' };
  return { ok: true };
}

// Országos bajnokság jelentkezés: név, email, művésznév kötelező; eredmények és a
// „melyik nap nem megfelelő" opcionális.
export type ChampionshipInput = {
  name?: string;
  email?: string;
  stageName?: string;
  achievements?: string;
  unavailableDay?: string;
  consent?: unknown;
  eventSlug?: string;
  website?: string;
};

export function validateChampionship(input: ChampionshipInput): ValidationResult {
  if (input.website && String(input.website).trim() !== '') return { ok: false, error: 'spam' };
  if (!input.name || input.name.trim().length < 2) return { ok: false, error: 'A név megadása kötelező.' };
  if (!input.email || !EMAIL_RE.test(input.email)) return { ok: false, error: 'Érvényes email cím szükséges.' };
  if (!input.stageName || input.stageName.trim().length < 2) return { ok: false, error: 'A művésznév megadása kötelező.' };
  if (!isConsented(input.consent)) return { ok: false, error: 'Kérjük, fogadd el a jelentkezés feltételeit.' };
  return { ok: true };
}

// Havi klub jelentkezés: név/művésznév, email, és típus (verseny / open mic).
export type MonthlyContestInput = {
  name?: string;
  email?: string;
  entryType?: string; // 'verseny' | 'openmic'
  website?: string;
};

export function validateMonthlyContest(input: MonthlyContestInput): ValidationResult {
  if (input.website && String(input.website).trim() !== '') return { ok: false, error: 'spam' };
  if (!input.name || input.name.trim().length < 2) return { ok: false, error: 'A neved / művészneved megadása kötelező.' };
  if (!input.email || !EMAIL_RE.test(input.email)) return { ok: false, error: 'Érvényes email cím szükséges.' };
  if (input.entryType !== 'verseny' && input.entryType !== 'openmic') return { ok: false, error: 'Válaszd ki, versenyre vagy open mic-ra jelentkezel.' };
  return { ok: true };
}

// Slam klub beküldés: város + Facebook (vagy más) link kötelező.
export type SlamClubInput = {
  city?: string;
  name?: string;
  facebookUrl?: string;
  email?: string;
  website?: string;
};
export function validateSlamClub(input: SlamClubInput): ValidationResult {
  if (input.website && String(input.website).trim() !== '') return { ok: false, error: 'spam' };
  if (!input.city || input.city.trim().length < 2) return { ok: false, error: 'A város megadása kötelező.' };
  if (!input.facebookUrl || !/^https?:\/\/\S+$/i.test(input.facebookUrl.trim())) return { ok: false, error: 'Érvényes link szükséges (https://…).' };
  if (input.email && !EMAIL_RE.test(input.email)) return { ok: false, error: 'Az email cím nem érvényes.' };
  return { ok: true };
}

// A jelölőnégyzet sokféleképp érkezhet (true, "true", "on", "1") — egységesítjük.
export function isConsented(v: unknown): boolean {
  return v === true || v === 'true' || v === 'on' || v === '1' || v === 1;
}
