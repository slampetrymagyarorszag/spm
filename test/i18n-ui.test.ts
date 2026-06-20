import { describe, it, expect } from 'vitest';
import { t, ui } from '../src/i18n/ui';

describe('t()', () => {
  it('magyar kulcs', () => { expect(t('hu', 'nav.events')).toBe('Események'); });
  it('angol kulcs', () => { expect(t('en', 'nav.events')).toBe('Events'); });
  it('hiányzó angol kulcs → magyar fallback', () => {
    // szándékosan nem létező kulcs: a saját kulcsát adja vissza végső esetben
    expect(t('en', 'nincs.ilyen.kulcs')).toBe('nincs.ilyen.kulcs');
  });
  it('minden hu kulcsnak van en párja', () => {
    const huKeys = Object.keys(ui.hu);
    const enKeys = new Set(Object.keys(ui.en));
    const missing = huKeys.filter((k) => !enKeys.has(k));
    expect(missing).toEqual([]);
  });
});
