import { expect, it } from 'vitest';
import { clubFilterKey, csvCell, getClubOptions, submissionMonth } from '../src/sanity/lib/submissionExport';

it('groups club labels, retains unlabelled entries and excludes championship records', () => {
  const december = { kind: 'havi-klub', contextLabel: ' 2026. decemberi klub  ' };
  const rows = [december, { ...december, contextLabel: '2026. decemberi klub' }, { kind: 'havi-klub' },
    { kind: 'bajnoksag', contextLabel: '2026. decemberi klub' }];
  expect(getClubOptions(rows)).toEqual([
    { key: 'club:2026. decemberi klub', label: '2026. decemberi klub', count: 2 },
    { key: 'unlabelled', label: 'Klubmegnevezés nélkül', count: 1 },
  ]);
  expect(rows.filter(row => clubFilterKey(row) === clubFilterKey(december))).toHaveLength(2);
});

it('matches the Budapest calendar month used for export timestamps', () => {
  expect(submissionMonth('2026-11-30T23:30:00Z')).toBe('2026-12');
  expect(submissionMonth('2026-06-30T22:30:00Z')).toBe('2026-07');
  expect(submissionMonth('invalid')).toBeUndefined();
});

it('exports submitted text safely and preserves quoted delimiters and line breaks', () => {
  expect(csvCell(' =2+2')).toBe("' =2+2");
  expect(csvCell('Név; „színpad”')).toBe('"Név; „színpad”"');
  expect(csvCell('Első\rMásodik')).toBe('"Első\rMásodik"');
});
