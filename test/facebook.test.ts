import { describe, it, expect } from 'vitest';
import { parseFbPostId, fbObjectIdCandidates, deriveTitleAndBody } from '../src/lib/facebook';

describe('parseFbPostId', () => {
  it('/{oldal}/posts/{id}', () => {
    expect(parseFbPostId('https://www.facebook.com/SlamPoetryHungary/posts/1234567890')).toBe('1234567890');
  });
  it('permalink story_fbid', () => {
    expect(parseFbPostId('https://www.facebook.com/permalink.php?story_fbid=999&id=55')).toBe('999');
  });
  it('photo fbid', () => {
    expect(parseFbPostId('https://www.facebook.com/photo/?fbid=777&set=a.1')).toBe('777');
  });
  it('share link', () => {
    expect(parseFbPostId('https://www.facebook.com/share/p/AbCd123/')).toBe('AbCd123');
  });
  it('pfbid poszt', () => {
    expect(parseFbPostId('https://www.facebook.com/page/posts/pfbid0xYz9')).toBe('pfbid0xYz9');
  });
  it('érvénytelen → null', () => {
    expect(parseFbPostId('nem-url')).toBeNull();
    expect(parseFbPostId('')).toBeNull();
  });
});

describe('fbObjectIdCandidates', () => {
  it('numerikus id-hez page-prefixet ad', () => {
    expect(fbObjectIdCandidates('123', '55')).toEqual(['55_123', '123']);
  });
  it('opaque id-t nyersen hagy', () => {
    expect(fbObjectIdCandidates('pfbidXY', '55')).toEqual(['pfbidXY']);
  });
  it('page nélkül csak az id', () => {
    expect(fbObjectIdCandidates('123')).toEqual(['123']);
  });
});

describe('deriveTitleAndBody', () => {
  it('első sor a cím, bekezdések külön', () => {
    const r = deriveTitleAndBody('Nagy bejelentés!\n\nRészletek itt.\n\nGyertek el.');
    expect(r.title).toBe('Nagy bejelentés!');
    expect(r.paragraphs).toEqual(['Nagy bejelentés!', 'Részletek itt.', 'Gyertek el.']);
  });
  it('hosszú címet levág', () => {
    const long = 'a'.repeat(120);
    expect(deriveTitleAndBody(long).title.length).toBeLessThanOrEqual(91);
  });
});
