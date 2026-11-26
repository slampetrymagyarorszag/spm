import test from 'node:test';
import assert from 'node:assert/strict';
import { clients, requestJson } from './services.mjs';
const env={FB_PAGE_ID:'100',FB_PAGE_ACCESS_TOKEN:'secret',PUBLIC_SANITY_PROJECT_ID:'test123',PUBLIC_SANITY_DATASET:'production',SANITY_WRITE_TOKEN:'secret',OPENAI_API_KEY:'secret'};

test('raw Sanity perspective belongs in the query string, not POST JSON',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    assert.equal(new URL(url).searchParams.get('perspective'),'raw');
    assert.deepEqual(JSON.parse(options.body),{query:'*[_id==$id][0]',params:{id:'test'}});
    return {ok:true,json:async()=>({result:null})};
  };
  try {assert.equal(await clients(env).query('*[_id==$id][0]',{id:'test'}),null);}finally{globalThis.fetch=original;}
});
test('Facebook pagination removes query tokens and sends credentials only to the Graph host',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async(url,options)=>{
    assert.equal(new URL(url).searchParams.has('access_token'),false);
    assert.equal(options.headers.Authorization,'Bearer secret');
    calls++;
    return {ok:true,json:async()=>calls===1?{data:[{id:'first'}],paging:{next:'https://graph.facebook.com/v19.0/100/posts?after=2&access_token=secret'}}:{data:[{id:'second'}]}};
  };
  try {assert.deepEqual((await clients(env).edge('posts',{})).map(x=>x.id),['first','second']);}finally{globalThis.fetch=original;}
});
test('provider error messages never surface echoed credentials',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>({ok:false,status:400,json:async()=>({error:{code:190,message:'token secret invalid'}})});
  try {await assert.rejects(requestJson('https://example.test'),e=>!e.message.includes('secret') && e.message.includes('190'));}finally{globalThis.fetch=original;}
});
