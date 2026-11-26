import type { SanityClient } from '@sanity/client';
export async function saveRegistrationSettings(client: SanityClient, data: any) {
  const monthly = data.monthlyContest || {};
  if (monthly.enabled && !monthly.monthLabel?.trim()) throw new Error('A havi klub megnevezése kötelező, ha be van kapcsolva.');
  if (data.championshipCtaFrom && data.championshipCtaTo && data.championshipCtaFrom >= data.championshipCtaTo) throw new Error('A bajnoki zárásnak a nyitás után kell lennie.');
  if (monthly.opensAt && monthly.closesAt && monthly.opensAt >= monthly.closesAt) throw new Error('A havi klub zárásának a nyitás után kell lennie.');
  await client.createIfNotExists({_id:'siteSettings',_type:'siteSettings'});
  const [published,draft] = await client.getDocuments(['siteSettings','drafts.siteSettings']);
  if (!published) throw new Error('Nem található a beállítás. Próbáld újra.');
  if (data._rev && data._rev !== published._rev) throw new Error('Más is módosította a beállításokat. Töltsd újra a felületet, és ellenőrizd az időpontokat.');
  const set: Record<string,any> = {
    championshipCtaEnabled:!!data.championshipCtaEnabled,
    championshipCtaLabel:data.championshipCtaLabel || 'Jelentkezem az országos bajnokságra',
    championshipDays:(data.championshipDays || []).map((s:string)=>s.trim()).filter(Boolean),
    'monthlyContest.enabled':!!monthly.enabled,'monthlyContest.monthLabel':monthly.monthLabel || '',
    'monthlyContest.buttonLabel':monthly.buttonLabel || 'Jelentkezem a havi versenyre',
  };
  const unset:string[]=[];
  for (const [path,value] of Object.entries({championshipCtaUrl:data.championshipCtaUrl,championshipCtaIntro:data.championshipCtaIntro,championshipCtaFrom:data.championshipCtaFrom,championshipCtaTo:data.championshipCtaTo,'monthlyContest.intro':monthly.intro,'monthlyContest.opensAt':monthly.opensAt,'monthlyContest.closesAt':monthly.closesAt})) {
    if (value) set[path]=value; else unset.push(path);
  }
  const tx=client.transaction();
  for (const doc of [published,draft].filter(Boolean)) tx.patch(doc!._id,p=>p.ifRevisionId(doc!._rev).setIfMissing({monthlyContest:{_type:'object'}}).set(set).unset(unset));
  return tx.commit();
}
