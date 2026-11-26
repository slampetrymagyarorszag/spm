import { useCallback, useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { IntentLink } from 'sanity/router';
import { Box, Button, Card, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui';

type Dashboard = {
  slammers: number;
  eventTips: number;
  clubs: number;
  edits: number;
  submissions: number;
  requests: { _id: string; _type: string; slammerName?: string; stageName?: string; realName?: string; title?: string; eventName?: string; name?: string }[];
  upcoming: { _id: string; title: string; startsAt?: string; cover?: unknown }[];
  drafts: { _id: string; title: string }[];
};

export function EditorialDashboardTool() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await client.fetch<Dashboard>(`{
        "requests": *[!(_id in path("drafts.**")) && ((_type == "slammerEditRequest" && coalesce(handled, false) == false) || (_type == "slammerApplication" && coalesce(promoted, false) == false) || (_type == "eventTip" && coalesce(approved, false) == false && coalesce(promoted, false) == false) || (_type == "slamClub" && coalesce(approved, false) == false))] | order(submittedAt desc)[0...8]{_id,_type,slammerName,stageName,realName,title,eventName,name},
        "slammers": count(*[_type == "slammerApplication" && !(_id in path("drafts.**")) && coalesce(promoted, false) == false]),
        "eventTips": count(*[_type == "eventTip" && !(_id in path("drafts.**")) && coalesce(approved, false) == false && coalesce(promoted, false) == false]),
        "clubs": count(*[_type == "slamClub" && !(_id in path("drafts.**")) && coalesce(approved, false) == false]),
        "edits": count(*[_type == "slammerEditRequest" && !(_id in path("drafts.**")) && coalesce(handled, false) == false]),
        "submissions": count(*[_type == "formSubmission" && !(_id in path("drafts.**"))]),
        "upcoming": *[_type == "event" && !(_id in path("drafts.**")) && startsAt >= now()] | order(startsAt asc)[0...5]{_id,title,startsAt,cover},
        "drafts": *[_type == "post" && _id in path("drafts.**")] | order(_updatedAt desc)[0...5]{_id,title}
      }`, {}, { perspective: 'raw' });
      setData(result);
    } catch (e: any) { setError(e?.message || 'Nem sikerült betölteni az áttekintést.'); }
  }, [client]);
  useEffect(() => { load(); }, [load]);

  const linkStyle = {fontFamily:'inherit',color:'inherit',fontSize:14,lineHeight:1.6,textUnderlineOffset:3};
  const metric = (label: string, count: number) => <Card key={label} padding={4} radius={2} border style={{ minWidth: 150, flex: '1 1 150px' }}>
    <Stack space={3}><Text size={1} muted>{label}</Text><Heading size={3}>{count}</Heading></Stack>
  </Card>;

  return <Card padding={4} style={{ minHeight: '100%', overflowY:'auto', fontFamily:'system-ui, -apple-system, sans-serif' }}>
    <Stack space={5} style={{ maxWidth: 1000 }}>
      <Flex gap={3} align="center" justify="space-between"><Stack space={2}><Heading size={2}>Szia! Mivel foglalkozol ma?</Heading><Text size={1} muted>Mi vár elbírálásra, és mi jelenik meg legközelebb?</Text></Stack><Button text="Frissítés" mode="ghost" onClick={load} /></Flex>
      {error && <Card padding={3} tone="critical"><Text>{error}</Text></Card>}
      {!data && !error ? <Flex gap={2} align="center"><Spinner /><Text>Betöltés…</Text></Flex> : data ? <>
        <Flex gap={3} wrap="wrap">
          <IntentLink style={linkStyle} intent="create" params={{type:'post'}}>Új hír</IntentLink>
          <IntentLink style={linkStyle} intent="create" params={{type:'event'}}>Új esemény</IntentLink>
          <IntentLink style={linkStyle} intent="create" params={{type:'mediaItem'}}>Új médiatári elem</IntentLink>
          <a style={linkStyle} href="/admin#/sugo">Hogyan csináljam? Súgó</a>
        </Flex>
        <Flex gap={3} wrap="wrap">
          {metric('Beküldött slammerek', data.slammers)}
          {metric('Eseménytippek', data.eventTips)}
          {metric('Jóváhagyásra váró klubok', data.clubs)}
          {metric('Profiljavítási kérések', data.edits)}
        </Flex>
        <Card padding={4} border><Stack space={4}><Heading size={1}>Feldolgozásra vár</Heading>
        {data.requests.length ? data.requests.map(request => <IntentLink style={linkStyle} key={request._id} intent="edit" params={{ id: request._id, type: request._type }}>{request.slammerName || request.stageName || request.realName || request.title || request.eventName || request.name || 'Név nélküli beküldés'} · {({slammerEditRequest:'profiljavítás',slammerApplication:'új slammer',eventTip:'eseménytipp',slamClub:'klub'} as Record<string,string>)[request._type]}</IntentLink>) : <Text size={1} muted>Nincs feldolgozásra váró beküldés.</Text>}
        <a style={linkStyle} href="/admin#/structure">Minden tartalom és korábbi kérés</a></Stack></Card>
        <Flex gap={4} wrap="wrap">
          <Box flex={1} style={{ minWidth: 280 }}><Card padding={4} radius={2} border><Stack space={3}>
            <Heading size={1}>Közelgő események</Heading>
            {data.upcoming.length ? data.upcoming.map((event) => <Text key={event._id} size={1}>
              <IntentLink style={linkStyle} intent="edit" params={{id:event._id,type:'event'}}>{event.title}</IntentLink> · {event.startsAt ? new Date(event.startsAt).toLocaleString('hu-HU', {timeZone:'Europe/Budapest'}) : 'nincs dátum'}{!event.cover && ' · ⚠ nincs borító'}
            </Text>) : <Text size={1} muted>Jelenleg nincs közelgő esemény.</Text>}
          </Stack></Card></Box>
          <Box flex={1} style={{ minWidth: 280 }}><Card padding={4} radius={2} border><Stack space={3}>
            <Heading size={1}>Hírpiszkozatok</Heading>
            {data.drafts.length ? data.drafts.map((post) => <Text key={post._id} size={1}><IntentLink style={linkStyle} intent="edit" params={{id:post._id.replace(/^drafts\./,''),type:'post'}}>{post.title || 'Cím nélküli hír'}</IntentLink></Text>) : <Text size={1} muted>Nincs hírpiszkozat.</Text>}
          </Stack></Card></Box>
        </Flex>
        <Card padding={4} radius={2} border><Flex gap={3} align="center" wrap="wrap"><Text size={1}>Jelentkezések a naplóban: {data.submissions}</Text><a style={linkStyle} href="/admin#/structure/registrations;export">Jelentkezők és export</a><a style={linkStyle} href="/admin#/structure/registrations;settings">Jelentkezés megnyitása / lezárása</a></Flex></Card>
      </> : null}
    </Stack>
  </Card>;
}
