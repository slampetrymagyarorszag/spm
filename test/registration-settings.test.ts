import {expect,it,vi} from 'vitest';
import {saveRegistrationSettings} from '../src/sanity/lib/registrationSettings';
it('updates only registration fields on both published settings and an existing draft, with revision guards',async()=>{
 const calls:any[]=[];const tx:any={patch:(id:string,fn:any)=>{const record:any={id};const p:any={ifRevisionId:(rev:string)=>{record.rev=rev;return p},setIfMissing:()=>p,set:(fields:any)=>{record.fields=fields;return p},unset:()=>p};fn(p);calls.push(record);return tx},commit:vi.fn().mockResolvedValue({})};
 const client:any={createIfNotExists:vi.fn(),getDocuments:vi.fn().mockResolvedValue([{_id:'siteSettings',_rev:'p1'},{_id:'drafts.siteSettings',_rev:'d1'}]),transaction:()=>tx};
 await saveRegistrationSettings(client,{_rev:'p1',monthlyContest:{enabled:true,monthLabel:'December'}});
 expect(calls.map(c=>[c.id,c.rev])).toEqual([['siteSettings','p1'],['drafts.siteSettings','d1']]);
 expect(calls[0].fields['monthlyContest.monthLabel']).toBe('December');expect(calls[0].fields.home).toBeUndefined();expect(tx.commit).toHaveBeenCalledOnce();
});
it('rejects stale settings and invalid time windows before writing',async()=>{
 const client:any={createIfNotExists:vi.fn(),getDocuments:vi.fn().mockResolvedValue([{_id:'siteSettings',_rev:'new'}]),transaction:vi.fn()};
 await expect(saveRegistrationSettings(client,{_rev:'old'})).rejects.toThrow(/Más is/);expect(client.transaction).not.toHaveBeenCalled();
 await expect(saveRegistrationSettings(client,{monthlyContest:{opensAt:'2026-12-02',closesAt:'2026-12-01'}})).rejects.toThrow(/zárás/);
});
