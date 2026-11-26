import { appendFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { clients, editPost, resolveShortEventLinks } from './services.mjs';
import { STATE_ID, MODEL, MAX_AI_CALLS, due, reserveBudget, eventIds, findDuplicate, eventPatch, sourceId, sourceHash, slugify, paragraphBlocks, sourceBlock, validateArticle } from './core.mjs';

const DAY=86400000;
const POST_FIELDS='id,from,message,created_time,permalink_url,full_picture,attachments{type,url,title,description,target,subattachments}';
const EVENT_FIELDS='id,name,start_time,end_time,description,place,cover,ticket_uri,is_canceled';
const CONTENT_QUERY='*[_type in ["post","event"]] | order(_createdAt desc) [0...1000]{_id,_rev,_type,title,excerpt,slug,startsAt,endsAt,location,ticketUrl,facebookEventUrl,showFrom,cover,sourceId,"links":body[].markDefs[].href}';
const getState = api => api.query('*[_id==$id][0]',{id:STATE_ID});
const getMarker = (api,id) => api.query('*[_id==$id][0]',{id});
const publicUrl = d => `https://slampoetry.hu/${d._type==='event'?'esemenyek':'hirek'}/${d.slug.current}`;
const isDraft = d => d?._id.startsWith('drafts.');
const hasDraft = (docs,id) => docs.some(d=>d._id===`drafts.${id.replace(/^drafts\./,'')}`);

async function updateState(api,values) {
  await api.mutate([{createIfNotExists:{_id:STATE_ID,_type:'spmBotState'}}]);
  const current=await getState(api);
  await api.mutate([{patch:{id:STATE_ID,ifRevisionID:current._rev,set:values}}]);
}
async function chargeReservation(api,now) {
  await api.mutate([{createIfNotExists:{_id:STATE_ID,_type:'spmBotState'}}]);
  const current=await getState(api);
  const budget=reserveBudget(current.budget,now);
  await api.mutate([{patch:{id:STATE_ID,ifRevisionID:current._rev,set:{budget}}}]);
  return budget;
}
async function verifyPublished(api,doc,fetchLive) {
  const saved=await api.query('*[_id==$id][0]{_id,title,slug,startsAt,cover}',{id:doc._id});
  if(!saved || saved.slug?.current!==doc.slug.current || !saved.cover?.asset?._ref)throw Error('Published document read-back mismatch: '+doc._id);
  if(doc.startsAt && new Date(saved.startsAt).getTime()!==new Date(doc.startsAt).getTime())throw Error('Published event date mismatch: '+doc._id);
  const url=publicUrl(doc);
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const r=await fetchLive(url,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});
      const html=await r.text();
      // The original title may be HTML-escaped; normalize the common entities.
      const plain=html.replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&amp;/g,'&').replace(/&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ');
      if(r.ok && plain.includes(doc.title) && html.includes(doc.slug.current))return url;
    }catch{}
    if(attempt<2)await new Promise(r=>setTimeout(r,5000));
  }
  throw Error('CMS saved, live page not verified: '+url);
}

export async function run({env=process.env,apply=false,force=false,now=new Date(),api=clients(env),editor=editPost,resolveLinks=resolveShortEventLinks,fetchLive=fetch}={}) {
  const report={at:now.toISOString(),mode:apply?'publish':'dry-run',model:MODEL,status:'running',changes:[],skipped:[],errors:[],sources:{},aiCalls:0};
  const state=await getState(api)||{};
  report.reservedCents=state.budget?.month===now.toISOString().slice(0,7) ? state.budget.reservedCents||0 : 0;
  if(apply && !force && !due(state.lastCompleted,now))return {...report,status:'not-due',nextDue:new Date(new Date(state.lastCompleted).getTime()+3*DAY).toISOString()};
  // Model authentication is read-only. Actual generation is separately bounded.
  if(!apply) {
    const r=await fetchLive(`https://api.openai.com/v1/models/${MODEL}`,{headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw Error(`OpenAI model check: HTTP ${r.status}`);
  }
  const docs=await api.query(CONTENT_QUERY);
  if(docs.length>=1000)throw Error('Content inventory limit reached; refusing partial duplicate check');
  const since=state.lastSources?.posts && state.lastSources?.feed ? Math.min(new Date(state.lastSources.posts),new Date(state.lastSources.feed))-7*DAY : now-14*DAY;
  const posts=new Map();
  const events=new Map();
  const successfulSources={};
  for(const edge of ['posts','feed','events']) {
    try {
      const rows=await api.edge(edge,{fields:edge==='events'?EVENT_FIELDS:POST_FIELDS,since:String(Math.floor((edge==='events'?now-DAY:since)/1000))});
      report.sources[edge]=rows.length;
      successfulSources[edge]=now.toISOString();
      for(const row of rows) {
        if(edge==='events')events.set(row.id,row);
        // Feed includes visitor posts: only the page's own posts/shares are authorized.
        else if(row.from?.id===env.FB_PAGE_ID || (!row.from && row.id?.startsWith(env.FB_PAGE_ID+'_')))posts.set(row.id,row);
      }
    }catch(e){report.errors.push(`${edge}: ${e.message}`);}
  }
  for(const post of posts.values()) {
    try {
      const ids=[...new Set([...eventIds(post),...await resolveLinks(post)])];
      for(const id of ids)if(!events.has(id))events.set(id,await api.graph(id,{fields:EVENT_FIELDS}));
    }catch(e){report.errors.push(`Shared events in ${post.id}: ${e.message}`);}
  }
  const remember=async(kind,source,decision,documentId)=> {
    if(!apply)return;
    const id=sourceId('source-'+kind,source.id);
    const marker={_id:id,_type:'spmBotSource',kind,sourceId:source.id,sourceHash:sourceHash(source),decision,checkedAt:now.toISOString(),...(documentId?{documentId}:{})};
    // Markers are bot-owned. They contain no source text or private data.
    await api.mutate([{createOrReplace:marker}]);
  };
  for(const event of events.values()) {
    const markerId=sourceId('source-event',event.id);
    try {
      if(!event.start_time || !/[T].*(?:Z|[+-]\d{2}:?\d{2})$/.test(event.start_time) || !Number.isFinite(Date.parse(event.start_time)))throw Error('Missing explicit event time/timezone');
      if(new Date(event.end_time||event.start_time)<new Date(now-DAY)){report.skipped.push({source:event.id,reason:'past event'});continue;}
      if(event.is_canceled)throw Error('Event canceled; manual review required, no automatic deletion');
      if(!event.name || !event.place?.name || !event.description?.trim())throw Error('Incomplete event title/location/description');
      const marker=await getMarker(api,markerId);
      let existing=findDuplicate(docs,event,'event');
      if(!existing && marker?.documentId)existing=docs.find(d=>d._id===marker.documentId);
      if(marker?.decision==='published' && marker.sourceHash===sourceHash(event) && existing) {
        await verifyPublished(api,existing,fetchLive);report.skipped.push({source:event.id,reason:'unchanged event'});continue;
      }
      if(existing && (isDraft(existing)||hasDraft(docs,existing._id)))throw Error('Existing editor draft: '+existing._id);
      let doc=existing;
      if(existing) {
        let patch=eventPatch(existing,event);
        if(!existing.cover?.asset?._ref && event.cover?.source) {
          patch ||= {id:existing._id,ifRevisionID:existing._rev,set:{}};
          if(apply)patch.set.cover={...await api.image(event.cover.source,`https://www.facebook.com/events/${event.id}/`,event.id),alt:event.name};
        }
        if(patch) {
          if(apply)await api.mutate([{patch}]);
          doc={...existing,cover:patch.set.cover||existing.cover,startsAt:patch.set.startsAt||existing.startsAt,endsAt:patch.set.endsAt||existing.endsAt};
          report.changes.push({kind:'event',action:apply?'updated':'would-update',url:publicUrl(doc)});
        } else report.skipped.push({source:event.id,reason:'existing event'});
        if(apply){await verifyPublished(api,doc,fetchLive);await remember('event',event,'published',doc._id);}
      } else {
        if(!event.cover?.source)throw Error('Missing event cover');
        const facebookEventUrl=`https://www.facebook.com/events/${event.id}/`;
        doc={_id:sourceId('event',event.id),_type:'event',sourceId:event.id,title:event.name,slug:{_type:'slug',current:`${slugify(event.name)}-${new Date(event.start_time).toISOString().slice(0,10)}`},startsAt:new Date(event.start_time).toISOString(),facebookEventUrl,location:{_type:'location',name:event.place.name},description:[...paragraphBlocks(event.description.split(/\n{2,}/).filter(Boolean)),sourceBlock(facebookEventUrl)]};
        if(event.end_time)doc.endsAt=new Date(event.end_time).toISOString();
        if(event.ticket_uri)doc.ticketUrl=event.ticket_uri;
        if(event.place.location)doc.location.address=[event.place.location.street,event.place.location.zip,event.place.location.city,event.place.location.country].filter(Boolean).join(', ');
        if(apply) {
          doc.cover={...await api.image(event.cover.source,facebookEventUrl,event.id),alt:event.name};
          await api.mutate([{createIfNotExists:doc},{createIfNotExists:{_id:markerId,_type:'spmBotSource',kind:'event',sourceId:event.id,documentId:doc._id,decision:'saved-pending-verification'}}]);
          docs.push(doc);await verifyPublished(api,doc,fetchLive);await remember('event',event,'published',doc._id);
        }
        report.changes.push({kind:'event',action:apply?'published':'would-publish',url:publicUrl(doc)});
      }
    }catch(e){report.errors.push(`Event ${event.id}: ${e.message}`);}
  }
  for(const post of [...posts.values()].sort((a,b)=>Date.parse(a.created_time)-Date.parse(b.created_time))) {
    try {
      const markerId=sourceId('source-post',post.id);
      const marker=await getMarker(api,markerId);
      let existing=findDuplicate(docs,post,'post');
      if(!existing && marker?.documentId)existing=docs.find(d=>d._id===marker.documentId);
      if(existing) {
        if(marker?.decision==='saved-pending-verification')await verifyPublished(api,existing,fetchLive);
        await remember('post',post,'duplicate',existing._id);report.skipped.push({source:post.id,reason:'existing article'});continue;
      }
      if(marker?.sourceHash===sourceHash(post) && marker.decision==='skip'){report.skipped.push({source:post.id,reason:'already assessed'});continue;}
      if(!post.message?.trim()){await remember('post',post,'skip');report.skipped.push({source:post.id,reason:'no source text'});continue;}
      if(!apply){report.changes.push({kind:'post',action:'needs-editorial-check',source:post.id,sourceUrl:post.permalink_url});continue;}
      if(report.aiCalls>=MAX_AI_CALLS)throw Error('Per-run AI call limit reached; deferred to next run');
      const budget=await chargeReservation(api,now);
      report.reservedCents=budget.reservedCents;
      report.aiCalls++;
      const {article,usage}=await editor(env.OPENAI_API_KEY,post,docs);
      report.actualAiUsd=(report.actualAiUsd||0)+((usage?.input_tokens||0)*0.75+(usage?.output_tokens||0)*4.5)/1e6;
      const a=validateArticle(article,post,docs);
      if(a.decision!=='publish') {
        await remember('post',post,a.decision,a.duplicateId);
        report.skipped.push({source:post.id,reason:a.decision});continue;
      }
      existing=findDuplicate(docs,post,'post',a.title);
      if(existing){await remember('post',post,'duplicate',existing._id);report.skipped.push({source:post.id,reason:'matching title'});continue;}
      if(!post.full_picture || !post.permalink_url)throw Error('Publishable news lacks original image/source URL');
      const doc={_id:sourceId('post',post.id),_type:'post',sourceId:post.id,title:a.title,slug:{_type:'slug',current:`${slugify(a.title)}-${post.id.split('_').at(-1)}`},publishedAt:new Date(post.created_time).toISOString(),author:'Slam Poetry Magyarország',excerpt:a.excerpt,body:[...paragraphBlocks(a.paragraphs),sourceBlock(post.permalink_url)],titleEn:a.titleEn,excerptEn:a.excerptEn,bodyEn:[...paragraphBlocks(a.paragraphsEn),sourceBlock(post.permalink_url)]};
      if(a.photoCredit){doc.body.push(...paragraphBlocks([`Fotó: ${a.photoCredit}`]).map(b=>({...b,_key:'credit'})));doc.bodyEn.push({...paragraphBlocks([`Photo: ${a.photoCredit}`])[0],_key:'credit'});}
      doc.cover={...await api.image(post.full_picture,post.permalink_url,post.id),alt:a.title};
      await api.mutate([{createIfNotExists:doc},{createIfNotExists:{_id:markerId,_type:'spmBotSource',kind:'post',sourceId:post.id,documentId:doc._id,decision:'saved-pending-verification'}}]);
      docs.push(doc);
      await verifyPublished(api,doc,fetchLive);await remember('post',post,'published',doc._id);
      report.changes.push({kind:'post',action:'published',url:publicUrl(doc),title:doc.title});
    }catch(e){report.errors.push(`Post ${post.id}: ${e.message}`);}
  }
  report.status=report.errors.length?'partial-failure':'success';
  if(apply) {
    const values={lastAttempt:now.toISOString(),lastReport:{status:report.status,changes:report.changes.length,errors:report.errors.length,aiCalls:report.aiCalls},model:MODEL};
    if(!report.errors.length){values.lastCompleted=now.toISOString();values.lastSources=successfulSources;}
    await updateState(api,values);
  }
  return report;
}

export function summary(report) {
  const lines=[`## SPM website bot — ${report.status}`,`Mode: ${report.mode}. Checked: ${report.at}.`,`AI calls: ${report.aiCalls}; reserved this month: ${report.reservedCents||0} US cents (maximum 100).`];
  for(const c of report.changes||[])lines.push(`- ${c.action}: ${c.url||c.sourceUrl||c.source}`);
  for(const e of report.errors||[])lines.push(`- ERROR: ${e}`);
  if(!report.changes?.length && !report.errors?.length)lines.push('No new content to publish.');
  if(report.nextDue)lines.push(`Next eligible run: ${report.nextDue}`);
  return lines.join('\n')+'\n';
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  let report;
  try {report=await run({apply:process.argv.includes('--apply'),force:process.argv.includes('--force')});}
  catch(e){report={at:new Date().toISOString(),mode:process.argv.includes('--apply')?'publish':'dry-run',status:'failed',changes:[],errors:[e.message],aiCalls:0};}
  writeFileSync('spm-bot-report.json',JSON.stringify(report,null,2));
  const text=summary(report);
  console.log(text);
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`did_run=${report.status!=='not-due'}\n`);
  if(report.errors?.length)process.exitCode=1;
}
