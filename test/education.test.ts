import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseEducationInput } from '../src/lib/education';
import { educationEmail } from '../src/lib/education-email';
vi.mock('../src/lib/mailer', () => ({ sendMail: vi.fn() }));
import { sendMail } from '../src/lib/mailer';
import { POST } from '../src/pages/api/education';
import { educationRecipients } from '../src/lib/education-guide';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('education enquiries', () => {
  it('preserves an optional programme choice and rejects unknown choices', () => {
    expect(parseEducationInput({ email: 'teacher@school.hu', program: 'workshop' })?.program).toBe('workshop');
    expect(parseEducationInput({ email: 'teacher@school.hu', program: 'lesson' })?.program).toBe('lesson');
    expect(parseEducationInput({ email: 'teacher@school.hu', program: '' })).not.toBeNull();
    expect(parseEducationInput({ email: 'teacher@school.hu', program: 'anything' })).toBeNull();
    expect(parseEducationInput({ email: 'teacher@school.hu', program: {} })).toBeNull();
  });
  it('identifies the selected workshop in the information email in both languages', () => {
    for (const lang of ['hu', 'en'] as const) {
      const html = educationEmail({ email: 'a@b.hu', name: '', school: '', message: '', lang, program: 'workshop' });
      expect(html).toContain(lang === 'hu' ? '<strong>Érdeklődésed:</strong> Kreatív írás / előadói workshop' : '<strong>Your interest:</strong> Creative writing / performance workshop');
    }
  });
  it('requires only a valid email and keeps all other fields optional', () => {
    expect(parseEducationInput({ email: 'teacher@school.hu' })).toEqual({ email: 'teacher@school.hu', name: '', school: '', message: '', lang: 'hu' });
    for (const value of [null, [], { email: 123 }, { email: 'bad' }, { email: 'a@b.hu', name: {} }, { email: 'a@b.hu', message: 'x'.repeat(3001) }]) expect(parseEducationInput(value)).toBeNull();
  });
  it('escapes optional input in the replyable information email', () => {
    const html = educationEmail({ email: 'a@b.hu', name: '<script>', school: '<img>', message: '<b>hello</b>', lang: 'hu' }, 'https://slampoetry.hu/tajekoztato.pdf');
    expect(html).not.toContain('<script>'); expect(html).toContain('&lt;img&gt;'); expect(html).toContain('rímképletekkel'); expect(html).toContain('tajekoztato.pdf');
    expect(html).toContain('Vajna Balázs'); expect(html).toContain('Elnök'); expect(html).toContain('tel:+36302318087'); expect(html).toContain('06302318087');
  });
  it('does not send when the education workflow is disabled', async () => {
    vi.stubEnv('EDUCATION_EMAIL_ENABLED', 'false');
    const url = new URL('http://localhost:4321/api/education');
    const response = await POST({ url, request: new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a@b.hu' }) }) } as never);
    expect(response.status).toBe(503); expect(sendMail).not.toHaveBeenCalled(); vi.unstubAllEnvs();
  });
  it('rejects cross-origin submissions before sending', async () => {
    const url = new URL('http://localhost:4321/api/education');
    const response = await POST({ url, request: new Request(url, { method: 'POST', headers: { origin: 'https://other.example', 'Content-Type': 'application/json' }, body: '{}' }) } as never);
    expect(response.status).toBe(403); expect(sendMail).not.toHaveBeenCalled();
  });
  it('attaches the actual branded PDF and copies the four contacts privately', async () => {
    vi.stubEnv('EDUCATION_EMAIL_ENABLED', 'true');
    vi.stubEnv('EDUCATION_REPLY_TO', 'oktatas@slampoetry.hu');
    const url = new URL('http://localhost:4321/api/education');
    const submit = () => POST({ url, request: new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'teacher@school.hu', program: 'workshop', message: 'Könyvtári programot szeretnénk.' }) }) } as never);
    expect((await submit()).status).toBe(200);
    const mail = vi.mocked(sendMail).mock.calls[0][0];
    expect(mail.to).toBe('teacher@school.hu');
    expect(mail.replyTo).toBe('oktatas@slampoetry.hu');
    expect(mail.from).toBe('Slam Poetry Magyarország <oktatas@slampoetry.hu>');
    expect(mail.bcc).toEqual(educationRecipients);
    const pdf = mail.attachments?.[0].content;
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(Buffer.from(pdf!).subarray(0, 5).toString()).toBe('%PDF-');
    expect(mail.html).toContain('csatolt PDF');
    expect(mail.html).toContain('<strong>Érdeklődésed:</strong> Kreatív írás / előadói workshop');
    expect(mail.html).toContain('Vajna Balázs');
    expect(mail.html).not.toContain('blyworx@gmail.com');
    expect((await submit()).status).toBe(200);
    expect(vi.mocked(sendMail).mock.calls[1][0].idempotencyKey).toBe(mail.idempotencyKey);
  });
  it('reports a sending error instead of displaying a successful submission', async () => {
    vi.stubEnv('EDUCATION_EMAIL_ENABLED', 'true');
    vi.stubEnv('EDUCATION_REPLY_TO', 'oktatas@slampoetry.hu');
    vi.mocked(sendMail).mockRejectedValueOnce(new Error('provider unavailable'));
    const url = new URL('http://localhost:4321/api/education');
    const response = await POST({ url, request: new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'teacher@school.hu' }) }) } as never);
    expect(response.status).toBe(500);
  });
});
