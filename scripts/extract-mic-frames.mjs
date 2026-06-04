// Kinyeri a forgó mikrofon-videóból a scroll-scrub képkockákat.
// Egyszeri asset-lépés: a kockák már a public/mic-frames/-ben vannak commitálva.
// Újrafuttatáshoz előbb: `npm i -D ffmpeg-static` (utána eltávolítható).
// Használat: node scripts/extract-mic-frames.mjs <videofajl> [fps] [szelesseg]
// A kockák JPG-ként a public/mic-frames/ mappába kerülnek (fekete háttér + mix-blend-screen
// miatt nem kell átlátszóság), és egy manifest.json rögzíti a darabszámot.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';

const input = process.argv[2];
if (!input) {
  console.error('Adj meg egy videofájl elérési utat. Pl: node scripts/extract-mic-frames.mjs mic.mp4');
  process.exit(1);
}
const fps = Number(process.argv[3] ?? 12);
const width = Number(process.argv[4] ?? 560);
const outDir = 'public/mic-frames';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync(
  ffmpegPath,
  ['-i', input, '-vf', `fps=${fps},scale=${width}:-1`, '-q:v', '4', `${outDir}/frame_%03d.jpg`],
  { stdio: 'inherit' }
);

const count = readdirSync(outDir).filter((f) => f.endsWith('.jpg')).length;
writeFileSync(`${outDir}/manifest.json`, JSON.stringify({ count, ext: 'jpg' }));
console.log(`Kész: ${count} képkocka a ${outDir}/ mappában.`);
