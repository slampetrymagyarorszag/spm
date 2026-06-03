import { describe, it, expect } from 'vitest';
import { filterSlammers } from '../src/components/islands/searchSlammers';

const data = [
  { _id: '1', name: 'Simon Márton', slug: 'simon-marton', hometown: 'Budapest' },
  { _id: '2', name: 'Mavrák Kata', slug: 'mavrak-kata', hometown: 'Szeged' },
];

describe('filterSlammers', () => {
  it('üres keresésre mindent visszaad', () => { expect(filterSlammers(data, '')).toHaveLength(2); });
  it('név alapján szűr', () => { expect(filterSlammers(data, 'simon')).toEqual([data[0]]); });
  it('város alapján szűr', () => { expect(filterSlammers(data, 'szeged')).toEqual([data[1]]); });
  it('nincs találat', () => { expect(filterSlammers(data, 'xyz')).toHaveLength(0); });
});
