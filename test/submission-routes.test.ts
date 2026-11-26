import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({fetch:vi.fn(),create:vi.fn(),upload:vi.fn(),mail:vi.fn()}));
vi.mock('sanity:client',()=>({sanityClient:{fetch:mocks.fetch}}));
vi.mock('../src/sanity/lib/writeClient',()=>({writeClient:{fetch:mocks.fetch,create:mocks.create,assets:{upload:mocks.upload}}}));
vi.mock('../src/sanity/lib/api',()=>({getEmailSettings:vi.fn().mockResolvedValue({})}));
vi.mock('../src/lib/mailer',()=>({sendMail:mocks.mail}));
import {POST as club} from '../src/pages/api/slam-club';
import {POST as tip} from '../src/pages/api/event-tip';
import {POST as edit} from '../src/pages/api/slammer-edit';
import {POST as monthly} from '../src/pages/api/monthly-contest';
import {POST as registration} from '../src/pages/api/registration';
const call=(handler:any,data:any)=>handler({request:new Request('http://localhost/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})});
beforeEach(()=>{vi.clearAllMocks();mocks.create.mockResolvedValue({_id:'test'});mocks.mail.mockResolvedValue({});mocks.fetch.mockResolvedValue([]);});
describe('public submission routes with mocked persistence',()=>{
 it('stores a valid club awaiting moderation',async()=>{
  expect((await call(club,{city:'Szeged',facebookUrl:'https://facebook.com/club'})).status).toBe(200);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({_type:'slamClub',approved:false,city:'Szeged'}));
 });
 it('keeps a valid event tip moderated and enforces consent',async()=>{
  const data={eventName:'Slam est',description:'Slam poetry klub',facebookUrl:'https://facebook.com/events/1'};
  expect((await call(tip,data)).status).toBe(400);expect(mocks.create).not.toHaveBeenCalled();
  expect((await call(tip,{...data,consent:true})).status).toBe(200);expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({approved:false,_type:'eventTip'}));
 });
 it('returns a real persistence failure instead of success for a club',async()=>{
  mocks.create.mockRejectedValue(new Error('offline'));
  expect((await call(club,{city:'Szeged',facebookUrl:'https://facebook.com/club'})).status).toBe(500);
 });
 it.each([null,[],{city:23}])('rejects malformed club data without throwing: %j',async input=>{expect((await call(club,input)).status).toBe(400);expect(mocks.create).not.toHaveBeenCalled();});
 it('accepts an active-only edit and stores a stable reference and server-derived name',async()=>{
  mocks.fetch.mockResolvedValue([{_id:'slammer1',name:'Valódi név'}]);
  const body=new FormData();body.set('slammerSlug','valodi');body.set('slammerName','Hamis név');body.set('activeSlammer','1');
  const response=await edit({request:new Request('http://localhost/api/slammer-edit',{method:'POST',body})} as any);
  expect(response.status).toBe(200);expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({slammer:expect.objectContaining({_type:'reference',_ref:'slammer1'}),slammerName:'Valódi név',activeRequest:true}));
 });
 it('rejects a request for a nonexistent profile before uploading or creating',async()=>{
  const body=new FormData();body.set('slammerSlug','missing');body.set('activeSlammer','1');
  expect((await edit({request:new Request('http://localhost/api/slammer-edit',{method:'POST',body})} as any)).status).toBe(400);expect(mocks.create).not.toHaveBeenCalled();expect(mocks.upload).not.toHaveBeenCalled();
 });
 it('blocks expired event registration even if the old page still shows the form',async()=>{
  mocks.fetch.mockResolvedValue({title:'Lejárt',registrationEnabled:true,registrationDeadline:'2020-01-01'});
  expect((await call(registration,{eventSlug:'lejart',name:'Teszt',email:'test@example.hu',message:'Jelentkezem'})).status).toBe(400);expect(mocks.mail).not.toHaveBeenCalled();
 });
});

describe('durable registration logging',()=>{
 const input={name:'Teszt',email:'test@example.hu',entryType:'verseny'};
 it('does not accept monthly registration if CMS logging fails',async()=>{
  mocks.fetch.mockResolvedValue({enabled:true,monthLabel:'Teszt klub'});mocks.create.mockRejectedValue(new Error('offline'));
  expect((await call(monthly,input)).status).toBe(503);expect(mocks.mail).not.toHaveBeenCalled();
 });
 it('returns success for a stored entrant even when notification fails, preventing a duplicate retry',async()=>{
  mocks.fetch.mockResolvedValue({enabled:true,monthLabel:'Teszt klub'});mocks.mail.mockRejectedValue(new Error('mail offline'));
  expect((await call(monthly,input)).status).toBe(200);expect(mocks.create).toHaveBeenCalledOnce();
 });
 it('rejects a closed monthly registration without storing it',async()=>{
  mocks.fetch.mockResolvedValue({enabled:true,closesAt:'2020-01-01'});
  expect((await call(monthly,input)).status).toBe(400);expect(mocks.create).not.toHaveBeenCalled();
 });
 it('returns an actionable service error when CMS lookup is unavailable',async()=>{
  mocks.fetch.mockRejectedValue(new Error('unavailable'));
  expect((await call(monthly,input)).status).toBe(503);
 });
 it('does not accept championship registration if CMS logging fails',async()=>{
  mocks.fetch.mockResolvedValue({title:'Bajnokság',registrationEnabled:true,championshipRegistration:true});mocks.create.mockRejectedValue(new Error('offline'));
  expect((await call(registration,{eventSlug:'teszt',kind:'championship',name:'Teszt',stageName:'Teszt',email:'test@example.hu',consent:true})).status).toBe(503);expect(mocks.mail).not.toHaveBeenCalled();
 });
});
it('accepts a video-only edit without a bio or new photo',async()=>{
 mocks.fetch.mockResolvedValue([{_id:'slammer1',name:'Teszt'}]);
 const body=new FormData();body.set('slammerSlug','teszt');body.append('videoLink','https://youtu.be/abc12345678');
 expect((await edit({request:new Request('http://localhost/api/slammer-edit',{method:'POST',body})} as any)).status).toBe(200);
 expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({videoLinks:['https://youtu.be/abc12345678']}));
});
