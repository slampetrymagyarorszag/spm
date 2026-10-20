import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const educationRecipients = [
  'mespet93@gmail.com',
  'blyworx@gmail.com',
  'zsofia.barat@gmail.com',
  'atl.beni@gmail.com',
];

export async function educationGuideAttachment() {
  // The Vercel adapter explicitly bundles this file alongside the server function.
  const content = await readFile(join(process.cwd(), 'public/education/slam-poetry-tajekoztato.pdf'));
  if (content.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid education guide');
  return { filename: 'Slam-Poetry-Magyarorszag-tajekoztato.pdf', content };
}
