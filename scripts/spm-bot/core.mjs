import { createHash } from 'node:crypto';

export const MODEL = 'gpt-5.4-mini-2026-03-17';
export const MAX_AI_CALLS = 8;
export const MAX_OUTPUT_TOKENS = 4000;
export const MAX_INPUT_BYTES = 24000;
export const STATE_ID = 'spmBot.state';
export const normalize = (s='') => s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const slugify = s => normalize(s).replace(/ /g,'-').slice(0,100);
export const sourceId = (kind,id) => `spmBot.${kind}.${createHash('sha256').update(String(id)).digest('hex').slice(0,24)}`;
export const due = (last,now=new Date()) => !last || now-new Date(last)>=72*3600000;
export function reserveBudget(previous={},now=new Date()) {
  const month=now.toISOString().slice(0,7);
  const reservedCents=(previous.month===month ? previous.reservedCents||0 : 0)+4;
  if(reservedCents>100) throw Error('Monthly AI budget reached (1 USD); retry next month.');
  return {month,reservedCents};
}
export function safeImageUrl(value) {
  try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && /(^|\.)(fbcdn\.net|fbsbx\.com)$/.test(u.hostname);} catch {return false;}
}
export function sourceHash(s) {
  const image=s.full_picture||s.cover?.source;
  let imagePath=null;
  try {const u=new URL(image);imagePath=u.origin+u.pathname;} catch {}
  return createHash('sha256').update(JSON.stringify({id:s.id,message:s.message,name:s.name,description:s.description,start:s.start_time,end:s.end_time,place:s.place,ticket:s.ticket_uri,canceled:s.is_canceled,imagePath,attachments:s.attachments ? JSON.stringify(s.attachments,(k,v)=>['image','media'].includes(k)?undefined:v) : undefined})).digest('hex');
}
export function eventIds(post) {
  const ids=new Set();
  const scan=s=>{for(const m of String(s||'').matchAll(/(?:www\.|m\.|web\.)?facebook\.com\/events\/(\d+)/gi)) ids.add(m[1]);};
  scan(post.message);
  const walk=a=>{scan(a.url);scan(a.target?.url);scan(a.description);if(a.type==='event' && /^\d+$/.test(a.target?.id)) ids.add(a.target.id);for(const sub of a.subattachments?.data||[])walk(sub);};
  for(const a of post.attachments?.data||[])walk(a);
  return [...ids];
}
function facebookId(value) {
  const s=String(value||'');
  return s.match(/(?:posts|events)\/(\d+)/)?.[1] || s.match(/[?&](?:story_fbid|fbid)=(\d+)/)?.[1] || s.match(/(?:^|_)(\d+)$/)?.[1];
}
export function findDuplicate(rows,source,kind,title) {
  const id=facebookId(source.id);
  return rows.find(d=>{
    if(d._type!==kind)return false;
    if(d.sourceId===source.id || d._id===sourceId(kind,source.id))return true;
    const links=[d.facebookEventUrl,...(d.links||[])].filter(Boolean);
    if(id && links.some(l=>facebookId(l)===id))return true;
    const sameTitle=normalize(d.title)===normalize(title||source.name||source.message?.split('\n')[0]);
    return sameTitle && (kind==='post' || new Date(d.startsAt).getTime()===new Date(source.start_time).getTime());
  });
}
export function eventPatch(existing,source) {
  const set={};
  if(source.start_time && new Date(existing.startsAt).getTime()!==new Date(source.start_time).getTime())set.startsAt=new Date(source.start_time).toISOString();
  if(source.end_time && new Date(existing.endsAt).getTime()!==new Date(source.end_time).getTime())set.endsAt=new Date(source.end_time).toISOString();
  if(source.place?.name && source.place.name!==existing.location?.name) {
    if(existing.location)set['location.name']=source.place.name;
    else set.location={_type:'location',name:source.place.name};
  }
  const l=source.place?.location;
  const address=l && [l.street,l.zip,l.city,l.country].filter(Boolean).join(', ');
  if(address && address!==existing.location?.address) {
    if(set.location)set.location.address=address;
    else set['location.address']=address;
  }
  if(source.ticket_uri && source.ticket_uri!==existing.ticketUrl)set.ticketUrl=source.ticket_uri;
  return Object.keys(set).length ? {id:existing._id,ifRevisionID:existing._rev,set} : null;
}
export function block(text,key='b0') {return {_type:'block',_key:key,style:'normal',markDefs:[],children:[{_type:'span',_key:`${key}s`,marks:[],text}]};}
export function sourceBlock(url) {const b=block('Eredeti Facebook-bejegyzés / Original Facebook post','source');b.markDefs=[{_key:'source',_type:'link',href:url}];b.children[0].marks=['source'];return b;}
export const paragraphBlocks = values => values.map((p,i)=>block(p,`p${i}`));
export function validateArticle(a,source,existing=[]) {
  if(!['publish','skip','duplicate'].includes(a.decision))throw Error('Invalid editorial decision');
  if(a.decision==='duplicate') {
    if(!existing.some(d=>d._id===a.duplicateId && d._type==='post'))throw Error('Unknown duplicate document');
    return a;
  }
  if(a.decision==='skip')return a;
  for(const k of ['title','excerpt','titleEn','excerptEn'])if(typeof a[k]!=='string' || !a[k].trim())throw Error('Missing article '+k);
  if(a.title.length>180 || a.excerpt.length>700)throw Error('Article length invalid');
  if(!a.paragraphs?.length || !a.paragraphsEn?.length)throw Error('Missing article paragraphs');
  const text=[source.message||'',...(source.attachments?.data||[]).flatMap(x=>[x.title||'',x.description||''])].join('\n');
  if(!a.evidence?.length || a.evidence.some(q=>!q.trim() || !text.includes(q)))throw Error('Article evidence not in source');
  if(a.photoCredit && !text.includes(a.photoCredit))throw Error('Photo credit not in source');
  const generated=[a.title,a.excerpt,...a.paragraphs,a.titleEn,a.excerptEn,...a.paragraphsEn].join('\n');
  if(/https?:\/\//.test(generated))throw Error('Generated article URL is not allowed');
  const numbers=s=>[...s.matchAll(/\d+(?:[.,]\d+)*/g)].map(m=>m[0].replace(/,/g,'.'));
  const sourceNumbers=new Set(numbers(text));
  if(numbers(generated).some(n=>!sourceNumbers.has(n)))throw Error('Article contains unsupported number');
  return a;
}
