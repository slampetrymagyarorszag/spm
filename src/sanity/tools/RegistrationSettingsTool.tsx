import { monthlyContestInUse, saveRegistrationSettings, type MonthlyContestSettings } from '../lib/registrationSettings';
import { useCallback, useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Box, Button, Card, Flex, Heading, Spinner, Stack, Text, TextInput, TextArea } from '@sanity/ui';

type Settings = {
  _rev?: string;
  championshipCtaEnabled?: boolean;
  championshipCtaLabel?: string;
  championshipCtaUrl?: string;
  championshipCtaIntro?: string;
  championshipDays?: string[];
  championshipCtaFrom?: string;
  championshipCtaTo?: string;
  monthlyContest?: MonthlyContestSettings;
  nextMonthlyContest?: MonthlyContestSettings | null;
};

const toLocal = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const toIso = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};
const inputStyle = { width: '100%', padding: '10px', borderRadius: 4, border: '1px solid var(--card-border-color)', background: 'var(--card-bg-color)', color: 'inherit' };
const monthNames = ['januári', 'februári', 'márciusi', 'áprilisi', 'májusi', 'júniusi', 'júliusi', 'augusztusi', 'szeptemberi', 'októberi', 'novemberi', 'decemberi'];

export function RegistrationSettingsTool() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [data, setData] = useState<Settings | null>(null);
  const [now, setNow] = useState(Date.now);
  const [savedMonthly, setSavedMonthly] = useState<MonthlyContestSettings>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const settings = await client.fetch<Settings | null>('*[_id == "siteSettings"][0]{_rev,championshipCtaEnabled,championshipCtaLabel,championshipCtaUrl,championshipCtaIntro,championshipDays,championshipCtaFrom,championshipCtaTo,monthlyContest,nextMonthlyContest}', {}, {perspective: 'raw'});
      setData(settings || {});
      setSavedMonthly(settings?.monthlyContest);
    } catch (e: any) { setError(e?.message || 'Nem sikerült betölteni a beállításokat.'); }
  }, [client]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const deadlines = [
      data?.monthlyContest?.opensAt, data?.monthlyContest?.closesAt, savedMonthly?.closesAt,
      data?.championshipCtaFrom, data?.championshipCtaTo,
    ].filter((date): date is string => !!date).map(Date.parse);
    const upcoming = deadlines.filter((time) => time > now);
    if (!upcoming.length) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, Math.min(2147483647, Math.min(...upcoming) - Date.now())));
    return () => clearTimeout(timer);
  }, [data, savedMonthly, now]);

  const change = (patch: Partial<Settings>) => { setData((old) => ({ ...(old || {}), ...patch })); setMessage(null); };
  const changeMonthly = (patch: Partial<NonNullable<Settings['monthlyContest']>>) => {
    setData((old) => ({ ...(old || {}), monthlyContest: { ...(old?.monthlyContest || {}), ...patch } }));
    setMessage(null);
  };
  const changeNext = (patch: Partial<MonthlyContestSettings>) => {
    setData((old) => ({ ...old, nextMonthlyContest: { ...old?.nextMonthlyContest, ...patch } }));
    setMessage(null);
  };
  const field = (label: string, value: string | undefined, onChange: (value: string) => void, hint?: string) => <Stack space={2}>
    <Text size={1} weight="semibold">{label}</Text>
    <TextInput aria-label={label} value={value || ''} onChange={(e) => onChange(e.currentTarget.value)} />
    {hint && <Text size={1} muted>{hint}</Text>}
  </Stack>;
  const dateField = (label: string, value: string | undefined, onChange: (value: string | undefined) => void, hint = 'Üresen hagyva nincs időzítés.') => <Stack space={2}>
    <Text size={1} weight="semibold">{label}</Text>
    <input aria-label={label} type="datetime-local" style={inputStyle} value={toLocal(value)} onChange={(e) => onChange(toIso(e.currentTarget.value))} />
    <Text size={1} muted>{hint}</Text>
  </Stack>;
  const currentState = (enabled?: boolean, from?: string, to?: string) => {
    if (!enabled) return 'Kikapcsolva';
    if (from && new Date(from).getTime() > now) return 'Időzítve — még nem nyílt meg';
    if (to && new Date(to).getTime() <= now) return 'Lezárult';
    return 'Aktív az aktuális beállítások szerint';
  };
  const prepareNextMonth = () => {
    const monthly = data?.monthlyContest || {};
    const match = monthly.monthLabel?.match(/^(\d{4})\.\s*(.+?)\s+klub$/i);
    const index = match ? monthNames.findIndex((name) => name === match[2].toLowerCase()) : -1;
    const nextIndex = (index + 1) % 12;
    const nextYear = match ? Number(match[1]) + (nextIndex === 0 ? 1 : 0) : undefined;
    changeNext({
      buttonLabel: monthly.buttonLabel,
      monthLabel: index >= 0 && nextYear ? `${nextYear}. ${monthNames[nextIndex]} klub` : '',
      opensAt: undefined,
      closesAt: undefined,
    });
    setError(null);
    setMessage('A következő hónap piszkozata elkészült. Ellenőrizd a nevét és az időpontokat, majd mentsd a beállításokat.');
  };

  const save = async (activateNext = false) => {
    if (!data) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await saveRegistrationSettings(client, data, activateNext);
      await load();
      setMessage(activateNext
        ? 'A következő klub mostantól az aktuális klub. A jelentkezés a beállított nyitástól érhető el.'
        : 'A beállítások mentve. A nyilvános oldal néhány percen belül frissül.');
    } catch (e: any) { setError(e?.message || 'Nem sikerült menteni.'); }
    finally { setBusy(false); }
  };

  return <Card padding={4} style={{ minHeight: '100%' }}>
    <Stack space={5} style={{ maxWidth: 850 }}>
      <Stack space={2}>
        <Heading size={2}>Jelentkezések beállításai</Heading>
        <Text size={1} muted>Itt állíthatod be a főoldali jelentkezések időpontjait. A következő havi klubot külön piszkozatban készítheted elő.</Text>
        <Text size={1} muted>Az időpontokat a böngésződ időzónájában látod ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</Text>
      </Stack>
      {error && <Card padding={3} radius={2} tone="critical"><Text>{error}</Text></Card>}
      {message && <Card padding={3} radius={2} tone="positive"><Text>{message}</Text></Card>}
      {!data && !error ? <Flex gap={2} align="center"><Spinner /><Text>Betöltés…</Text></Flex> : data ? <>
        <Card padding={4} radius={2} border><Stack space={4}>
          <Heading size={1}>Aktuális havi klub</Heading>
          <Text size={1} muted>{currentState(data.monthlyContest?.enabled, data.monthlyContest?.opensAt, data.monthlyContest?.closesAt)}</Text>
          <label><input type="checkbox" checked={!!data.monthlyContest?.enabled} onChange={(e) => changeMonthly({ enabled: e.currentTarget.checked })} /> Jelentkezési gomb bekapcsolva</label>
          {field('Melyik havi klub', data.monthlyContest?.monthLabel, (value) => changeMonthly({ monthLabel: value }), 'Például: 2026. októberi klub. Ez alapján lehet később külön exportálni.')}
          {field('Gomb felirata', data.monthlyContest?.buttonLabel, (value) => changeMonthly({ buttonLabel: value }))}
          <Flex gap={3} wrap="wrap"><Box flex={1} style={{ minWidth: 220 }}>{dateField('Jelentkezés nyitása', data.monthlyContest?.opensAt, (value) => changeMonthly({ opensAt: value }), 'Bekapcsolt jelentkezésnél üresen hagyva rögtön megnyílik.')}</Box><Box flex={1} style={{ minWidth: 220 }}>{dateField('Jelentkezés zárása', data.monthlyContest?.closesAt, (value) => changeMonthly({ closesAt: value }), 'Ettől az időponttól a gomb eltűnik, és a rendszer lezárja az űrlapot. Üresen hagyva kézzel zárhatod le.')}</Box></Flex>
          <Stack space={2}><Text size={1} weight="semibold">Rövid szöveg az űrlapban</Text><TextArea value={data.monthlyContest?.intro || ''} onChange={(e) => changeMonthly({ intro: e.currentTarget.value })} /></Stack>
        </Stack></Card>
        <Card padding={4} radius={2} border><Stack space={4}>
          <Heading size={1}>Következő havi klub</Heading>
          <Text size={1} muted>A piszkozat mentésével előre megadhatod a következő klub adatait. A piszkozatot a Jelentkezési beállítások mentése gombbal mentheted. Váltani az aktuális jelentkezés lezárása után tudsz.</Text>
          {data.nextMonthlyContest ? <>
            {field('Következő klub megnevezése', data.nextMonthlyContest.monthLabel, (value) => changeNext({ monthLabel: value }))}
            {field('Következő klub gombfelirata', data.nextMonthlyContest.buttonLabel, (value) => changeNext({ buttonLabel: value }))}
            <Flex gap={3} wrap="wrap">
              <Box flex={1} style={{ minWidth: 220 }}>{dateField('Következő jelentkezés nyitása', data.nextMonthlyContest.opensAt, (value) => changeNext({ opensAt: value }), 'Üresen hagyva a váltás után rögtön megnyílik.')}</Box>
              <Box flex={1} style={{ minWidth: 220 }}>{dateField('Következő jelentkezés zárása', data.nextMonthlyContest.closesAt, (value) => changeNext({ closesAt: value }), 'Üresen hagyva kézzel zárhatod le.')}</Box>
            </Flex>
            <Stack space={2}><Text size={1} weight="semibold">Rövid szöveg a következő űrlapban</Text><TextArea aria-label="Rövid szöveg a következő űrlapban" value={data.nextMonthlyContest.intro || ''} onChange={(e) => changeNext({ intro: e.currentTarget.value })} /></Stack>
            <Box><Button text="Váltás a következő klubra" mode="ghost" disabled={busy || monthlyContestInUse(savedMonthly)} onClick={() => save(true)} /></Box>
          </> : <Box><Button text="Következő havi klub előkészítése" mode="ghost" disabled={busy} onClick={prepareNextMonth} /></Box>}
        </Stack></Card>
        <Card padding={4} radius={2} border><Stack space={4}>
          <Heading size={1}>Országos bajnokság</Heading>
          <Text size={1} muted>{currentState(data.championshipCtaEnabled, data.championshipCtaFrom, data.championshipCtaTo)}</Text>
          <label><input type="checkbox" checked={!!data.championshipCtaEnabled} onChange={(e) => change({ championshipCtaEnabled: e.currentTarget.checked })} /> Jelentkezési gomb bekapcsolva</label>
          {field('Gomb felirata', data.championshipCtaLabel, (value) => change({ championshipCtaLabel: value }))}
          <Flex gap={3} wrap="wrap"><Box flex={1} style={{ minWidth: 220 }}>{dateField('Nyitás', data.championshipCtaFrom, (value) => change({ championshipCtaFrom: value }))}</Box><Box flex={1} style={{ minWidth: 220 }}>{dateField('Zárás', data.championshipCtaTo, (value) => change({ championshipCtaTo: value }))}</Box></Flex>
          <Stack space={2}><Text size={1} weight="semibold">Választható előválogató napok — soronként egy</Text><TextArea rows={3} value={(data.championshipDays || []).join('\n')} onChange={(e) => change({ championshipDays: e.currentTarget.value.split('\n').map((line) => line.trim()) })} /></Stack>
          <Stack space={2}><Text size={1} weight="semibold">Rövid szöveg az űrlapban</Text><TextArea value={data.championshipCtaIntro || ''} onChange={(e) => change({ championshipCtaIntro: e.currentTarget.value })} /></Stack>
          {field('Másik cél-URL — általában maradjon üres', data.championshipCtaUrl, (value) => change({ championshipCtaUrl: value }), 'Ha kitöltöd, a gomb a jelentkezési űrlap helyett erre a címre visz.')}
        </Stack></Card>
        <Button text={busy ? 'Mentés…' : 'Jelentkezési beállítások mentése'} tone="primary" disabled={busy} onClick={() => save()} />
      </> : null}
    </Stack>
  </Card>;
}
