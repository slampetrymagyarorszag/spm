// Tiszta, URL-barát slug magyar szövegből: ékezetek átírása, kisbetűsítés,
// nem alfanumerikus karakterek kötőjelre, kötőjelek rendezése, hosszkorlát.
const HU_MAP: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u',
};

export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[áéíóöőúüű]/g, (c) => HU_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-') // minden egyéb (ékezet, írásjel, szóköz) → kötőjel
    .replace(/^-+|-+$/g, '') // vezető/záró kötőjelek le
    .slice(0, 96)
    .replace(/-+$/g, ''); // ha a vágás kötőjelre esett
}
