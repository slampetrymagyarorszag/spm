import { Resend } from 'resend';

export type MailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  /** Egyedi fejlécek (pl. List-Unsubscribe a sajtólistás kiküldésnél). */
  headers?: Record<string, string>;
  /** Felülírja az alap feladót (pl. sajto@ a sajtóközleményeknél). */
  from?: string;
  bcc?: string[];
  attachments?: { filename: string; content: Buffer | string }[];
  idempotencyKey?: string;
};

export async function sendMail({ to, subject, html, replyTo, headers, from: fromOverride, bcc, attachments, idempotencyKey }: MailInput): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const from = fromOverride ?? import.meta.env.MAIL_FROM ?? process.env.MAIL_FROM ?? 'Slam Poetry <no-reply@slampoetry.hu>';
  if (!apiKey) {
    throw new Error('RESEND_API_KEY hiányzik — az email-küldés nincs konfigurálva.');
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html, replyTo, headers, bcc, attachments }, idempotencyKey ? { idempotencyKey } : undefined);
  if (error) throw new Error(`Email küldési hiba: ${error.message ?? 'ismeretlen'}`);
}
