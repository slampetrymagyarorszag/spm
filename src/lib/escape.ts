// HTML-escape az email-törzsbe kerülő felhasználói értékekhez (elemtartalomhoz).
export const escapeHtml = (s: string): string =>
  s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

// Fejléc-injekció ellen: CR/LF/TAB eltávolítása az egy soros fejléc-értékekből
// (pl. replyTo email, subject), hogy ne lehessen extra fejléceket befűzni.
export const sanitizeHeader = (s: string): string => s.replace(/[\r\n\t]/g, ' ').trim();
