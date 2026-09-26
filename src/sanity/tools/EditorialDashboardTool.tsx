import { useCallback, useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { IntentLink, StateLink } from 'sanity/router';
import { Box, Button, Card, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui';

type Dashboard = {
  slammers: number;
  eventTips: number;
  clubs: number;
  edits: number;
  submissions: number;
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
        "slammers": count(*[_type == "slammerApplication" && !(_id in path("drafts.**")) && promoted != true]),
        "eventTips": count(*[_type == "eventTip" && !(_id in path("drafts.**")) && approved != true && promoted != true]),
        "clubs": count(*[_type == "slamClub" && !(_id in path("drafts.**")) && approved != true]),
        "edits": count(*[_type == "slammerEditRequest" && !(_id in path("drafts.**")) && handled != true]),
        "submissions": count(*[_type == "formSubmission" && !(_id in path("drafts.**"))]),
        "upcoming": *[_type == "event" && !(_id in path("drafts.**")) && startsAt >= now()] | order(startsAt asc)[0...5]{_id,title,startsAt,cover},
        "drafts": *[_type == "post" && _id in path("drafts.**")] | order(_updatedAt desc)[0...5]{_id,title}
      }`, {}, { perspective: 'raw' });
      setData(result);
    } catch (e: any) { setError(e?.message || 'Nem sikerült betölteni az áttekintést.'); }
  }, [client]);
  useEffect(() => { load(); }, [load]);

  const metric = (label: string, count: number) => <Card key={label} padding={4} radius={2} border style={{ minWidth: 150, flex: '1 1 150px' }}>
    <Stack space={3}><Text size={1} muted>{label}</Text><Heading size={3}>{count}</Heading></Stack>
  </Card>;

  return <Card padding={4} style={{ minHeight: '100%' }}>
    <Stack space={5} style={{ maxWidth: 1000 }}>
      <Flex gap={3} align="center" justify="space-between"><Stack space={2}><Heading size={2}>Szerkesztői áttekintés</Heading><Text size={1} muted>Mi vár elbírálásra, és mi jelenik meg legközelebb?</Text></Stack><Button text="Frissítés" mode="ghost" onClick={load} /></Flex>
      {error && <Card padding={3} tone="critical"><Text>{error}</Text></Card>}
      {!data ? <Flex gap={2} align="center"><Spinner /><Text>Betöltés…</Text></Flex> : <>
        <Flex gap={3} wrap="wrap">
          {metric('Beküldött slammerek', data.slammers)}
          {metric('Eseménytippek', data.eventTips)}
          {metric('Jóváhagyásra váró klubok', data.clubs)}
          {metric('Profiljavítási kérések', data.edits)}
        </Flex>
        <Text size={1}><StateLink state={{ tool: 'structure', structure: undefined }} style={{ textDecoration: 'underline' }}>Beküldések és klubok megnyitása a Tartalom menüben</StateLink></Text>
        <Flex gap={4} wrap="wrap">
          <Box flex={1} style={{ minWidth: 280 }}><Card padding={4} radius={2} border><Stack space={3}>
            <Heading size={1}>Közelgő események</Heading>
            {data.upcoming.length ? data.upcoming.map((event) => <Text key={event._id} size={1}>
              <IntentLink intent="edit" params={{ id: event._id, type: 'event' }} style={{ textDecoration: 'underline' }}>{event.title}</IntentLink> · {event.startsAt ? new Date(event.startsAt).toLocaleString('hu-HU') : 'nincs dátum'}{!event.cover && ' · ⚠ nincs borító'}
            </Text>) : <Text size={1} muted>Jelenleg nincs közelgő esemény.</Text>}
          </Stack></Card></Box>
          <Box flex={1} style={{ minWidth: 280 }}><Card padding={4} radius={2} border><Stack space={3}>
            <Heading size={1}>Hírpiszkozatok</Heading>
            {data.drafts.length ? data.drafts.map((post) => <Text key={post._id} size={1}><IntentLink intent="edit" params={{ id: post._id.replace(/^drafts\./, ''), type: 'post' }} style={{ textDecoration: 'underline' }}>{post.title || 'Cím nélküli hír'}</IntentLink></Text>) : <Text size={1} muted>Nincs hírpiszkozat.</Text>}
          </Stack></Card></Box>
        </Flex>
        <Card padding={4} radius={2} border><Flex gap={3} align="center" wrap="wrap"><Text size={1}>Jelentkezések a naplóban: {data.submissions}</Text><StateLink state={{ tool: 'jelentkezesek-export', 'jelentkezesek-export': undefined }} style={{ textDecoration: 'underline' }}>Jelentkezések exportja</StateLink><StateLink state={{ tool: 'jelentkezesek-beallitasai', 'jelentkezesek-beallitasai': undefined }} style={{ textDecoration: 'underline' }}>Jelentkezések beállításai</StateLink></Flex></Card>
      </>}
    </Stack>
  </Card>;
}
