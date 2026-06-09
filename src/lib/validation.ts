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
