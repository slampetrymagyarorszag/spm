import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from './run.mjs';
import { STATE_ID, sourceId } from './core.mjs';

const env={FB_PAGE_ID:'100',OPENAI_API_KEY:'test'};
const now=new Date('2026-11-26T12:00:00Z');
const post={id:'100_111',from:{id:'100'},message:'Megjelent a klub videója.',permalink_url:'https://facebook.com/spm/posts/111',full_picture:'https://x.fbcdn.net/a.jpg',created_time:'2026-11-25T12:00:00Z'};
function fakeApi({state={},rows=[],feed=[post],failEdge}={}) {
  const data=new Map(rows.map(x=>[x._id,x]));data.set(STATE_ID,{_id:STATE_ID,_type:'spmBotState',_rev:'r1',...state});
  const writes=[];
  return {data,writes,
    async query(q,p){if(p?.id)return data.get(p.id);return [...data.values()].filter(d=>['post','event'].includes(d._type));},
    async edge(edge){if(edge===failEdge)throw Error('Unavailable');return edge==='feed'?feed:[];},
    async graph(){throw Error('Unexpected graph call');},
    async image(){return {_type:'image',asset:{_type:'reference',_ref:'image-id'}};},
    async mutate(ms){writes.push(...ms);for(const m of ms){if(m.createIfNotExists){const d=m.createIfNotExists;if(!data.has(d._id))data.set(d._id,{_rev:'r1',...d});}if(m.createOrReplace)data.set(m.createOrReplace._id,m.createOrReplace);if(m.patch){const d=data.get(m.patch.id);assert.equal(m.patch.ifRevisionID,d._rev);Object.assign(d,m.patch.set);d._rev+='x';}}},
  };
}
const fetchLive=async()=>({ok:true,text:async()=>'<html>Új klubvideó uj-klubvideo-111</html>'});
const editor=async()=>({article:{decision:'publish',title:'Új klubvideó',excerpt:'Megjelent a klub videója.',paragraphs:['Megjelent a klub videója.'],titleEn:'New club video',excerptEn:'The club video is available.',paragraphsEn:['The club video is available.'],evidence:['Megjelent a klub videója.'],photoCredit:null},usage:{input_tokens:100,output_tokens:200}});

test('dry-run reads providers but never mutates Sanity or calls the paid editor',async()=>{
  const api=fakeApi();const r=await run({env,api,now,fetchLive,resolveLinks:async()=>[],editor:()=>{throw Error('Paid call forbidden');}});
  assert.equal(api.writes.length,0);assert.equal(r.status,'success');assert.equal(r.changes[0].action,'needs-editorial-check');
});
test('publishing reserves budget before editing and rerunning does not duplicate or charge again',async()=>{
  const api=fakeApi();let calls=0;
  const edit=async()=>{calls++;assert.equal(api.data.get(STATE_ID).budget.reservedCents,4);return editor();};
  const args={env,api,now,apply:true,force:true,fetchLive,resolveLinks:async()=>[],editor:edit};
  const first=await run(args);assert.equal(first.status,'success');assert.equal(first.changes.length,1);
  const second=await run(args);assert.equal(second.status,'success');assert.equal(second.changes.length,0);assert.equal(calls,1);
  assert.equal([...api.data.values()].filter(d=>d._type==='post').length,1);
});
test('saved document survives live failure; retry verifies it instead of another AI call',async()=>{
  const api=fakeApi();let calls=0;
  const args={env,api,now,apply:true,force:true,resolveLinks:async()=>[],editor:async()=>{calls++;return editor();},fetchLive};
  // CMS readback failure is immediate, without waiting on HTTP retries.
  const query=api.query;let verificationFails=true;
  api.query=async(q,p)=>p?.id===sourceId('post',post.id) && verificationFails?undefined:query(q,p);
  const first=await run(args);assert.equal(first.status,'partial-failure');assert.equal(api.data.get(STATE_ID).lastCompleted,undefined);
  assert.equal(api.data.get(sourceId('source-post',post.id)).decision,'saved-pending-verification');
  verificationFails=false;
  const second=await run(args);assert.equal(second.status,'success');assert.equal(calls,1);
});
test('a partial Facebook source does not advance the successful checkpoint',async()=>{
  const api=fakeApi({failEdge:'events',feed:[]});const r=await run({env,api,now,apply:true,resolveLinks:async()=>[],fetchLive});
  assert.equal(r.status,'partial-failure');assert.equal(api.data.get(STATE_ID).lastCompleted,undefined);
});
test('visitor posts are ignored, even if the feed returns them',async()=>{
  const api=fakeApi({feed:[{...post,id:'200_111',from:{id:'200'}}]});
  const r=await run({env,api,now,fetchLive,resolveLinks:async()=>[]});assert.equal(r.changes.length,0);
});
test('a full monthly budget prevents a paid call and keeps the source retryable',async()=>{
  const api=fakeApi({state:{budget:{month:'2026-11',reservedCents:100}}});let called=false;
  const r=await run({env,api,now,apply:true,resolveLinks:async()=>[],editor:async()=>{called=true;},fetchLive});
  assert.equal(called,false);assert.equal(r.status,'partial-failure');assert.equal(api.data.has(sourceId('source-post',post.id)),false);
});
test('the 72-hour gate prevents work and writes between scheduled runs',async()=>{
  const api=fakeApi({state:{lastCompleted:'2026-11-25T12:00:00Z'}});
  const r=await run({env,api,now,apply:true});assert.equal(r.status,'not-due');assert.equal(api.writes.length,0);
});
