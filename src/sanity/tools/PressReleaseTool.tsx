import { useCallback, useEffect, useMemo, useState } from 'react';
import { useClient } from 'sanity';
import { Card, Stack, Heading, Text, Button, Flex, Box, Spinner, Select, TextInput, TextArea, Label } from '@sanity/ui';

type Contact = { _id: string; name?: string; email?: string; outlet?: string; tags?: string[]; subscribed?: boolean };

const SECRET_KEY = 'spm.press.secret';

export function PressReleaseTool() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [tag, setTag] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [secret, setSecret] = useState('');
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState<'' | 'test' | 'send'>('');
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'positive' | 'critical'; text: string } | null>(null);

  const load = useCallback(async () => {
    setContacts(null);
    const data = await client.fetch<Contact[]>(
      '*[_type == "pressContact"]|order(name asc){_id,name,email,outlet,tags,subscribed}',
    );
    setContacts(data || []);
  }, [client]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { setSecret(localStorage.getItem(SECRET_KEY) || ''); } catch { /* privát mód */ } }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    (contacts || []).forEach((c) => (c.tags || []).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [contacts]);

  // Ugyanaz a szűrés, mint a szerveren: feliratkozott + van címe + (ha van szűrő) címke.
  const recipients = useMemo(
    () => (contacts || []).filter((c) => c.subscribed !== false && !!c.email && (!tag || (c.tags || []).includes(tag))),
    [contacts, tag],
  );
  const unsubscribed = (contacts || []).filter((c) => c.subscribed === false).length;

  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/press-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, tag: tag || undefined, secret, ...payload }),
    });
    return { ok: res.ok, json: await res.json().catch(() => ({})) };
  };

  const rememberSecret = (v: string) => {
    setSecret(v);
    try { localStorage.setItem(SECRET_KEY, v); } catch { /* privát mód */ }
  };

  const sendTest = async () => {
    setBusy('test');
    setMsg(null);
    const { ok, json } = await post({ testTo });
    setMsg(ok && json.ok
      ? { tone: 'positive', text: `Teszt-levél elküldve ide: ${testTo}. Nézd át, mielőtt élesben kiküldöd.` }
      : { tone: 'critical', text: json.error || 'A teszt-küldés nem sikerült.' });
    setBusy('');
  };

  const sendReal = async () => {
    setBusy('send');
    setMsg(null);
    const { ok, json } = await post({ confirmCount: recipients.length });
    if (ok && json.ok) {
      const failed = (json.failed || []).length;
      setMsg({
        tone: failed ? 'critical' : 'positive',
        text: failed
          ? `Kiküldve ${json.sent} címre, ${failed} nem sikerült: ${(json.failed || []).map((f: any) => f.email).join(', ')}`
          : `Kész — a közlemény kiment ${json.sent} címre.`,
      });
      setConfirm(false);
    } else {
      setMsg({ tone: 'critical', text: json.error || 'A kiküldés nem sikerült.' });
      if (json.count != null) load();
    }
    setBusy('');
  };

  const canSend = subject.trim().length >= 3 && body.trim().length >= 10 && secret.length > 0;

  return (
    <Card padding={4} style={{ minHeight: '100%' }}>
      <Stack space={4}>
        <Stack space={2}>
          <Heading size={2}>Sajtóközlemény küldése</Heading>
          <Text muted size={1}>
            A közlemény minden címzettnek külön levélként megy ki (nem körlevélként), leiratkozó linkkel.
            A címzetteket a szerver olvassa a sajtólistáról. Éles kiküldés előtt küldj magadnak tesztet.
          </Text>
        </Stack>

        <Stack space={3}>
          <Box>
            <Label size={1} muted>Tárgy</Label>
            <Box marginTop={2}>
              <TextInput value={subject} onChange={(e) => setSubject(e.currentTarget.value)} />
            </Box>
          </Box>

          <Box>
            <Label size={1} muted>A közlemény szövege (üres sor = új bekezdés)</Label>
            <Box marginTop={2}>
              <TextArea rows={12} value={body} onChange={(e) => setBody(e.currentTarget.value)} />
            </Box>
          </Box>
        </Stack>

        <Flex gap={3} align="flex-end" wrap="wrap">
          <Box style={{ minWidth: 220 }}>
            <Label size={1} muted>Kiknek</Label>
            <Box marginTop={2}>
              <Select value={tag} onChange={(e) => setTag(e.currentTarget.value)}>
                <option value="">Teljes sajtólista</option>
                {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Box>
          </Box>
          <Box style={{ minWidth: 220 }}>
            <Label size={1} muted>Kiküldési jelszó</Label>
            <Box marginTop={2}>
              <TextInput type="password" value={secret} onChange={(e) => rememberSecret(e.currentTarget.value)} />
            </Box>
          </Box>
          <Button text="Lista frissítése" mode="ghost" onClick={load} />
        </Flex>

        {contacts === null ? (
          <Flex align="center" gap={2}><Spinner /><Text>Sajtólista betöltése…</Text></Flex>
        ) : (
          <Card padding={3} radius={2} tone="transparent" border>
            <Text size={1}>
              <strong>{recipients.length}</strong> címzett kapja meg{tag ? ` (címke: ${tag})` : ' (teljes lista)'}.
              {unsubscribed > 0 && ` ${unsubscribed} leiratkozott cím kimarad.`}
            </Text>
          </Card>
        )}

        <Card padding={3} radius={2} tone="primary" border>
          <Stack space={3}>
            <Text size={1}><strong>1. lépés — teszt magadnak</strong></Text>
            <Flex gap={2} align="center" wrap="wrap">
              <Box style={{ minWidth: 260 }}>
                <TextInput type="email" value={testTo} onChange={(e) => setTestTo(e.currentTarget.value)} />
              </Box>
              <Button text={busy === 'test' ? 'Küldés…' : 'Teszt küldése'} mode="ghost" disabled={!canSend || !testTo || busy !== ''} onClick={sendTest} />
            </Flex>
          </Stack>
        </Card>

        <Card padding={3} radius={2} tone="caution" border>
          <Stack space={3}>
            <Text size={1}>
              <strong>2. lépés — éles kiküldés.</strong> Ez {recipients.length} valódi újságírónak küld levelet, és nem vonható vissza.
            </Text>
            {!confirm ? (
              <Box>
                <Button text="Kiküldés…" tone="critical" disabled={!canSend || recipients.length === 0 || busy !== ''} onClick={() => setConfirm(true)} />
              </Box>
            ) : (
              <Flex gap={2}>
                <Button text={busy === 'send' ? 'Küldés folyamatban…' : `Igen, kiküldöm ${recipients.length} címre`} tone="critical" disabled={busy !== ''} onClick={sendReal} />
                <Button text="Mégse" mode="ghost" disabled={busy !== ''} onClick={() => setConfirm(false)} />
              </Flex>
            )}
          </Stack>
        </Card>

        {msg && (
          <Card padding={3} radius={2} tone={msg.tone}>
            <Text size={1}>{msg.text}</Text>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
