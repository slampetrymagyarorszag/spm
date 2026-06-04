import { describe, it, expect } from 'vitest';
import { slugify } from '../src/sanity/lib/slugify';

describe('slugify', () => {
  it('magyar ékezetes címet tiszta slugra alakít', () => {
    expect(slugify('Teszt hír Működik!')).toBe('teszt-hir-mukodik');
  });
  it('minden magyar ékezetet átír', () => {
    expect(slugify('Árvíztűrő tükörfúrógép')).toBe('arvizturo-tukorfurogep');
  });
  it('vezető/záró és dupla kötőjeleket rendez', () => {
    expect(slugify('  Helló --- Világ!!!  ')).toBe('hello-vilag');
  });
  it('üres bemenetre üres stringet ad', () => {
    expect(slugify('')).toBe('');
  });
});
