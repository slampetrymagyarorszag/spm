import { useCallback, useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Box, Button, Card, Flex, Heading, Spinner, Stack, Text, TextInput, TextArea } from '@sanity/ui';

type Settings = {
  championshipCtaEnabled?: boolean;
  championshipCtaLabel?: string;
  championshipCtaUrl?: string;
  championshipCtaIntro?: string;
  championshipDays?: string[];
  championshipCtaFrom?: string;
  championshipCtaTo?: string;
  monthlyContest?: {
    enabled?: boolean;
    monthLabel?: string;
    buttonLabel?: string;
    intro?: string;
    opensAt?: string;
    closesAt?: string;
  };
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const settings = await client.fetch<Settings | null>('*[_id == "siteSettings"][0]{championshipCtaEnabled,championshipCtaLabel,championshipCtaUrl,championshipCtaIntro,championshipDays,championshipCtaFrom,championshipCtaTo,monthlyContest}');
      setData(settings || {});
    } catch (e: any) { setError(e?.message || 'Nem sikerült betölteni a beállításokat.'); }
  }, [client]);
  useEffect(() => { load(); }, [load]);

  const change = (patch: Partial<Settings>) => { setData((old) => ({ ...(old || {}), ...patch })); setMessage(null); };
  const changeMonthly = (patch: Partial<NonNullable<Settings['monthlyContest']>>) => {
    setData((old) => ({ ...(old || {}), monthlyContest: { ...(old?.monthlyContest || {}), ...patch } }));
    setMessage(null);
  };
  const field = (label: string, value: string | undefined, onChange: (value: string) => void, hint?: string) => <Stack space={2}>
    <Text size={1} weight="semibold">{label}</Text>
    <TextInput aria-label={label} value={value || ''} onChange={(e) => onChange(e.currentTarget.value)} />
    {hint && <Text size={1} muted>{hint}</Text>}
  </Stack>;
  const dateField = (label: string, value: string | undefined, onChange: (value: string | undefined) => void) => <Stack space={2}>
    <Text size={1} weight="semibold">{label}</Text>
    <input aria-label={label} type="datetime-local" style={inputStyle} value={toLocal(value)} onChange={(e) => onChange(toIso(e.currentTarget.value))} />
    <Text size={1} muted>Üresen hagyva nincs időzítés.</Text>
  </Stack>;
  const currentState = (enabled?: boolean, from?: string, to?: string) => {
    const now = Date.now();
    if (!enabled) return 'Kikapcsolva';
    if (from && new Date(from).getTime() > now) return 'Időzítve — még nem nyílt meg';
    if (to && new Date(to).getTime() <= now) return 'Lezárult';
    return 'Aktív az aktuális beállítások szerint';
  };
  const prepareNextMonth = () => {
    const monthly = data?.monthlyContest || {};
    const match = monthly.monthLabel?.match(/^(\d{4})\.\s*(.+?)\s+klub$/i);
    const index = match ? monthNames.findIndex((name) => name === match[2].toLowerCase()) : -1;
    if (!match || index < 0) {
      setError('A következő hónap előkészítéséhez a megnevezés például „2026. októberi klub” legyen.');
      return;
    }
    const nextIndex = (index + 1) % 12;
    const nextYear = Number(match[1]) + (nextIndex === 0 ? 1 : 0);
    changeMonthly({
      enabled: false,
      monthLabel: `${nextYear}. ${monthNames[nextIndex]} klub`,
      opensAt: undefined,
      closesAt: undefined,
    });
    setError(null);
    setMessage('A következő hónap előkészítve, a gomb kikapcsolva maradt. Add meg az új nyitási/zárási dátumokat, majd mentsd el.');
  };

  const save = async () => {
    if (!data) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const monthly = data.monthlyContest || {};
      if (monthly.enabled && !monthly.monthLabel?.trim()) throw new Error('A havi klub megnevezése kötelező, ha be van kapcsolva.');
      if (data.championshipCtaFrom && data.championshipCtaTo && data.championshipCtaFrom >= data.championshipCtaTo) throw new Error('A bajnoki zárásnak a nyitás után kell lennie.');
      if (monthly.opensAt && monthly.closesAt && monthly.opensAt >= monthly.closesAt) throw new Error('A havi klub zárásának a nyitás után kell lennie.');
      await client.createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings' });
      let patch = client.patch('siteSettings').setIfMissing({ monthlyContest: { _type: 'object' } }).set({
        championshipCtaEnabled: !!data.championshipCtaEnabled,
        championshipCtaLabel: data.championshipCtaLabel || 'Jelentkezem az országos bajnokságra',
        championshipDays: (data.championshipDays || []).filter(Boolean),
        'monthlyContest.enabled': !!monthly.enabled,
        'monthlyContest.monthLabel': monthly.monthLabel || '',
        'monthlyContest.buttonLabel': monthly.buttonLabel || 'Jelentkezem a havi versenyre',
      });
      for (const [path, value] of Object.entries({
        championshipCtaUrl: data.championshipCtaUrl,
        championshipCtaIntro: data.championshipCtaIntro,
        championshipCtaFrom: data.championshipCtaFrom,
        championshipCtaTo: data.championshipCtaTo,
        'monthlyContest.intro': monthly.intro,
        'monthlyContest.opensAt': monthly.opensAt,
        'monthlyContest.closesAt': monthly.closesAt,
      })) patch = value ? patch.set({ [path]: value }) : patch.unset([path]);
      await patch.commit();
      await load();
      setMessage('Mentve. Az új verzió telepítése után a főoldal az aktuális beállításokat élőben olvassa.');
    } catch (e: any) { setError(e?.message || 'Nem sikerült menteni.'); }
    finally { setBusy(false); }
  };

  return <Card padding={4} style={{ minHeight: '100%' }}>
    <Stack space={5} style={{ maxWidth: 850 }}>
      <Stack space={2}>
        <Heading size={2}>Jelentkezések beállításai</Heading>
        <Text size={1} muted>Itt kapcsolhatod be és időzítheted a főoldali jelentkezési gombokat. A mentés nem indít új buildet.</Text>
      </Stack>
      {error && <Card padding={3} radius={2} tone="critical"><Text>{error}</Text></Card>}
      {message && <Card padding={3} radius={2} tone="positive"><Text>{message}</Text></Card>}
      {!data ? <Flex gap={2} align="center"><Spinner /><Text>Betöltés…</Text></Flex> : <>
        <Card padding={4} radius={2} border><Stack space={4}>
          <Heading size={1}>Havi klub</Heading>
          <Text size={1} muted>{currentState(data.monthlyContest?.enabled, data.monthlyContest?.opensAt, data.monthlyContest?.closesAt)}</Text>
          <Box><Button text="Következő havi klub előkészítése" mode="ghost" onClick={prepareNextMonth} /></Box>
          <label><input type="checkbox" checked={!!data.monthlyContest?.enabled} onChange={(e) => changeMonthly({ enabled: e.currentTarget.checked })} /> Jelentkezési gomb bekapcsolva</label>
          {field('Melyik havi klub', data.monthlyContest?.monthLabel, (value) => changeMonthly({ monthLabel: value }), 'Például: 2026. októberi klub. Ez alapján lehet később külön exportálni.')}
          {field('Gomb felirata', data.monthlyContest?.buttonLabel, (value) => changeMonthly({ buttonLabel: value }))}
          <Flex gap={3} wrap="wrap"><Box flex={1} style={{ minWidth: 220 }}>{dateField('Nyitás', data.monthlyContest?.opensAt, (value) => changeMonthly({ opensAt: value }))}</Box><Box flex={1} style={{ minWidth: 220 }}>{dateField('Zárás', data.monthlyContest?.closesAt, (value) => changeMonthly({ closesAt: value }))}</Box></Flex>
          <Stack space={2}><Text size={1} weight="semibold">Rövid szöveg az űrlapban</Text><TextArea value={data.monthlyContest?.intro || ''} onChange={(e) => changeMonthly({ intro: e.currentTarget.value })} /></Stack>
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
        <Button text={busy ? 'Mentés…' : 'Jelentkezési beállítások mentése'} tone="primary" disabled={busy} onClick={save} />
      </>}
    </Stack>
  </Card>;
}
