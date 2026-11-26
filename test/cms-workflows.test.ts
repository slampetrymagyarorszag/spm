import { describe,it,expect,vi } from 'vitest';
import { promoteEventTipDocument } from '../src/sanity/lib/promoteEventTip';
import { promoteSlammerDocument } from '../src/sanity/lib/promoteSlammer';
import { validateSlamClub,validateEventTip,validateMonthlyContest,validateChampionship,validateSubmission } from '../src/lib/validation';
function clientFor(source: any, draft: any = null) {
 const changes:any[]=[];const patch:any={ifRevisionId:vi.fn().mockReturnThis(),set:vi.fn().mockReturnThis()};
 const tx:any={create:vi.fn((doc:any)=>{changes.push(doc);return tx;}),patch:vi.fn((id:any,fn:any)=>{fn(patch);return tx;}),commit:vi.fn().mockResolvedValue({})};
 return {getDocuments:vi.fn().mockResolvedValue([source,draft]),fetch:vi.fn().mockResolvedValue(0),transaction:()=>tx,tx,patch,changes};
}
describe('moderated submissions',()=>{
 it('makes an event draft, preserves all text/links, and closes both source versions atomically',async()=>{
  const source={_id:'tip1',_rev:'t1',eventName:'Teszt klub',description:'Első\n\nMásodik',facebookUrl:'https://facebook.com/events/1',ticketUrl:'https://tixa.hu/test'};
  const draft={...source,_id:'drafts.tip1',_rev:'t2',eventName:'Javított név'};
  const c=clientFor(source,draft);await promoteEventTipDocument(c as any,draft);
  expect(c.changes[0]).toMatchObject({_id:'drafts.event-from-tip1',title:'Javított név',ticketUrl:source.ticketUrl});
  expect(c.changes[0].startsAt).toBeUndefined();expect(c.changes[0].description).toHaveLength(2);
  expect(c.tx.patch.mock.calls.map((v:any)=>v[0])).toEqual(['tip1','drafts.tip1']);expect(c.tx.commit).toHaveBeenCalledOnce();
 });
 it('blocks a stale or already processed tip without creating a target',async()=>{
  const source={_id:'tip1',_rev:'current',eventName:'Teszt'};const c=clientFor(source);
  await expect(promoteEventTipDocument(c as any,{...source,_rev:'stale'})).rejects.toThrow(/megváltozott/);
  expect(c.tx.create).not.toHaveBeenCalled();
 });
 it('does not mark a source completed when target creation fails',async()=>{
  const source={_id:'tip1',_rev:'t1',eventName:'Teszt'};const c=clientFor(source);c.tx.commit.mockRejectedValue(new Error('conflict'));
  await expect(promoteEventTipDocument(c as any,source)).rejects.toThrow('conflict');expect(c.tx.commit).toHaveBeenCalledOnce();
 });
 it('blocks duplicate slammer creation and directs the editor to profile review',async()=>{
  const source={_id:'app1',_rev:'a1',realName:'Teszt'};const c=clientFor(source);c.fetch.mockResolvedValue([{_id:'existing'}] as any);
  await expect(promoteSlammerDocument(c as any,source)).rejects.toThrow(/Már van/);expect(c.tx.create).not.toHaveBeenCalled();
 });
 it('creates a new slammer once and synchronizes completion across the published source and its draft',async()=>{
  const source={_id:'app1',_rev:'a1',realName:'Teszt'};const draft={...source,_id:'drafts.app1',_rev:'a2',description:'Friss bemutatkozás'};const c=clientFor(source,draft);c.fetch.mockResolvedValueOnce([] as any).mockResolvedValueOnce(0);
  await promoteSlammerDocument(c as any,draft);expect(c.changes[0].bio[0].children[0].text).toBe(draft.description);expect(c.tx.patch).toHaveBeenCalledTimes(2);expect(c.tx.commit).toHaveBeenCalledOnce();
 });
});
describe('invalid public form payloads',()=>{
 for(const [label,validate] of Object.entries({club:validateSlamClub,tip:validateEventTip,monthly:validateMonthlyContest,championship:validateChampionship,registration:validateSubmission})) {
  it(`${label}: malformed JSON fields become a validation error, not a server exception`,()=>{
   for(const input of [null,[],{city:42},{name:{}},{eventName:['x']},{website:{}}]) expect(validate(input as any).ok).toBe(false);
  });
 }
 it('valid clubs and tips stay moderated',()=>{
  expect(validateSlamClub({city:'Szeged',facebookUrl:'https://facebook.com/club'}).ok).toBe(true);
  expect(validateEventTip({eventName:'Klub',description:'Slam est lesz',facebookUrl:'https://facebook.com/events/1'}).ok).toBe(true);
 });
});
