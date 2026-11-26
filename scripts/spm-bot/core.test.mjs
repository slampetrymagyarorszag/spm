import test from 'node:test';
import assert from 'node:assert/strict';
import { eventIds, findDuplicate, eventPatch, due, reserveBudget, validateArticle, sourceHash, safeImageUrl } from './core.mjs';

test('event URLs are found in shares, subattachments and message links, never arbitrary target IDs', () => {
  const p = {message:'https://fb.me/e/short https://www.facebook.com/events/12345/', attachments:{data:[{type:'event',target:{id:'67890'}},{type:'photo',target:{id:'111'}},{subattachments:{data:[{url:'https://www.facebook.com/events/12345/'}]}}]}};
  assert.deepEqual(eventIds(p), ['12345','67890']);
});
test('duplicate detection covers legacy body source links, draft and alternate Facebook page ids', () => {
  const rows=[{_id:'drafts.legacy',_type:'post',links:['https://www.facebook.com/other/posts/55555'],title:'Más cím'}];
  assert.equal(findDuplicate(rows,{id:'111_55555',permalink_url:'https://facebook.com/page/posts/55555'},'post')._id,'drafts.legacy');
});
test('same event title on different dates is not a duplicate', () => {
  const rows=[{_id:'club',_type:'event',title:'Slam Poetry Budapest Klub',startsAt:'2026-11-04T18:00:00Z'}];
  assert.equal(findDuplicate(rows,{id:'999',name:'Slam Poetry Budapest Klub',start_time:'2026-12-02T19:00:00+0100'},'event'),undefined);
});
test('event matching recognizes existing Facebook links despite a changed title/date', () => {
  const rows=[{_id:'club',_type:'event',facebookEventUrl:'https://facebook.com/events/999/',title:'Old',startsAt:'2026-11-04T18:00:00Z'}];
  assert.equal(findDuplicate(rows,{id:'999',name:'New',start_time:'2026-12-02T19:00:00+0100'},'event')._id,'club');
});
test('event update changes only verified operational fields; never clears manual values', () => {
  const existing={_id:'event',_rev:'rev1',startsAt:'2026-12-02T18:00:00Z',ticketUrl:'https://tickets.test',description:['manual'],registrationEnabled:true};
  assert.deepEqual(eventPatch(existing,{start_time:'2026-12-02T20:00:00+0100'}),{id:'event',ifRevisionID:'rev1',set:{startsAt:'2026-12-02T19:00:00.000Z'}});
});
test('three-day gate survives month boundaries', () => {
  assert.equal(due('2026-11-30T09:00:00Z',new Date('2026-12-02T09:00:00Z')),false);
  assert.equal(due('2026-11-30T09:00:00Z',new Date('2026-12-03T09:00:00Z')),true);
});
test('an event without a location object gets a complete object instead of an invalid nested patch',()=>{
  const p=eventPatch({_id:'e',_rev:'r',startsAt:'2026-12-02T18:00:00Z'},{start_time:'2026-12-02T19:00:00+0100',place:{name:'Club',location:{city:'Budapest'}}});
  assert.deepEqual(p.set,{location:{_type:'location',name:'Club',address:'Budapest'}});
});
test('monthly budget reserves before calls, fails closed, and resets by month', () => {
  assert.throws(()=>reserveBudget({month:'2026-11',reservedCents:100},new Date('2026-11-30Z')),/budget/i);
  assert.deepEqual(reserveBudget({month:'2026-11',reservedCents:100},new Date('2026-12-01Z')),{month:'2026-12',reservedCents:4});
});
test('article validation rejects unsupported numbers, fake evidence, and invented source URLs', () => {
  const a={decision:'publish',title:'Bajnok',excerpt:'Győzelem',paragraphs:['58,2 ponttal nyert.'],titleEn:'Winner',excerptEn:'Winner',paragraphsEn:['Won with 58.2 points.'],evidence:['58,2 ponttal'],reason:'hír',duplicateId:null,photoCredit:null};
  assert.equal(validateArticle(a,{message:'58,2 ponttal nyert.'}).decision,'publish');
  assert.throws(()=>validateArticle({...a,paragraphs:['99 ponttal nyert.']},{message:'58,2 ponttal nyert.'}),/number/i);
  assert.throws(()=>validateArticle({...a,evidence:['kitalált idézet']},{message:'58,2 ponttal nyert.'}),/evidence/i);
  assert.throws(()=>validateArticle({...a,paragraphs:['Lásd https://fake.test']},{message:'58,2 ponttal nyert.'}),/URL/i);
});
test('volatile Facebook image query strings do not trigger new processing', () => {
  assert.equal(sourceHash({id:'x',message:'news',full_picture:'https://x.fbcdn.net/a.jpg?token=1'}),sourceHash({id:'x',message:'news',full_picture:'https://x.fbcdn.net/a.jpg?token=2'}));
});
test('image fetches accept only Facebook CDN HTTPS hosts', () => {
  assert.equal(safeImageUrl('https://scontent.xx.fbcdn.net/a.jpg'),true);
  for (const u of ['http://scontent.xx.fbcdn.net/a.jpg','https://127.0.0.1/a','https://fbcdn.net.evil.test/a','https://user:pass@x.fbcdn.net/a']) assert.equal(safeImageUrl(u),false);
});
