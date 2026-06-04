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
