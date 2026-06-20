import { useState } from 'react';
import { Card, Stack, Heading, Text, TextInput, Button, Flex, Badge } from '@sanity/ui';

// Studio-eszköz: a szerkesztő beilleszt egy Slam Poetry Magyarország Facebook poszt-linket,
// és a /api/import-fb-post végpont (szerveroldali Page-token) automatikusan létrehoz egy hírt
// a poszt szövegével és képével.
export function FacebookImportTool() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; slug?: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/import-fb-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setResult({ ok: true, msg: `Hír létrehozva: „${j.title}”${j.hadImage ? ' (képpel)' : ' (kép nélkül)'}. Nyisd meg a Hírek között és nézd át/publikáld.`, slug: j.slug });
        setUrl('');
      } else {
        setResult({ ok: false, msg: j.error || 'Ismeretlen hiba.' });
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || 'Hálózati hiba.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding={4} style={{ minHeight: '100%' }}>
      <Stack space={4} style={{ maxWidth: 640 }}>
        <Stack space={2}>
          <Heading size={2}>Facebook hír import</Heading>
          <Text muted size={1}>
            Illeszd be egy Slam Poetry Magyarország Facebook-poszt közvetlen linkjét, és automatikusan
            létrehozunk belőle egy hírt (szöveg + kép). Utána a „Hírek” között átnézheted és publikálhatod.
          </Text>
        </Stack>

        <Flex gap={2} align="center">
          <div style={{ flex: 1 }}>
            <TextInput
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              placeholder="https://www.facebook.com/SlamPoetryHungary/posts/…"
              disabled={busy}
            />
          </div>
          <Button text={busy ? 'Importálás…' : 'Importálás'} tone="primary" disabled={busy || url.trim().length < 8} onClick={run} />
        </Flex>

        {result && (
          <Card padding={3} radius={2} tone={result.ok ? 'positive' : 'critical'} border>
            <Flex gap={3} align="center">
              <Badge tone={result.ok ? 'positive' : 'critical'}>{result.ok ? 'Kész' : 'Hiba'}</Badge>
              <Text size={1}>{result.msg}</Text>
            </Flex>
          </Card>
        )}

        <Text muted size={0}>
          Beállítás: az importhoz a szerverre szükséges egy Facebook Page access token (.env: FB_PAGE_ACCESS_TOKEN)
          és az oldal azonosítója (FB_PAGE_ID). Token nélkül a Facebook nem engedi a poszt kiolvasását.
        </Text>
      </Stack>
    </Card>
  );
}
