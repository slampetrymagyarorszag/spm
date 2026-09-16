import { describe, it, expect } from 'vitest';
import { parseFbPostId, fbObjectIdCandidates, deriveTitleAndBody, isOpaquePostId } from '../src/lib/facebook';

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

describe('isOpaquePostId', () => {
  it('felismeri a mai pfbid linkek azonositojat', () => {
    expect(isOpaquePostId('pfbid0YffCkUVzhh6FVC46jxCYgrbgqVe5odxpfUqZZkZdf1Hn8SvGkdCiiFvovzebfbijl')).toBe(true);
    expect(isOpaquePostId('PFBID123')).toBe(true);
  });

  it('a numerikus (mukodo) azonositot nem jeloli annak', () => {
    expect(isOpaquePostId('1538956828264206')).toBe(false);
    expect(isOpaquePostId('128047023886269_1538956828264206')).toBe(false);
  });

  it('ures/hianyzo ertekre hamis', () => {
    expect(isOpaquePostId('')).toBe(false);
    expect(isOpaquePostId(undefined)).toBe(false);
  });

  it('a numerikus permalinkbol kinyert azonosito hasznalhato marad', () => {
    // Ez az a link, ami a valosagban mukodott.
    const id = parseFbPostId('https://www.facebook.com/1459238139569409/posts/1538956828264206');
    expect(id).toBe('1538956828264206');
    expect(isOpaquePostId(id!)).toBe(false);
    expect(fbObjectIdCandidates(id!, '128047023886269')[0]).toBe('128047023886269_1538956828264206');
  });
});
