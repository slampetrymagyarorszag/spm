import { useCallback, useEffect, useState } from 'react';
import { Card, Stack, Heading, Text, TextInput, Button, Flex, Badge, Box, Spinner } from '@sanity/ui';

type FbPost = {
  id: string;
  message: string;
  createdTime?: string;
  picture?: string | null;
  permalink?: string | null;
};

// Studio-eszköz: a szerkesztő kiválasztja az oldal egyik friss Facebook-posztját (vagy beilleszt
// egy linket), és a /api/import-fb-post végpont (szerveroldali Page-token) hírt készít belőle.
//
// A lista azért az elsődleges út, mert a mai Facebook-linkek „pfbid…” alakúak, azt pedig a Graph
// API nem tudja feloldani — és a Facebook a permalinkben sem adja vissza, tehát a beillesztett
// linket összepárosítani sem lehet a poszttal.
export function FacebookImportTool() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<string>('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [posts, setPosts] = useState<FbPost[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setPosts(null);
    setListError(null);
    try {
      const res = await fetch('/api/import-fb-post');
      const j = await res.json();
      if (res.ok && j.ok) setPosts(j.posts || []);
      else setListError(j.error || 'A posztok lekérése nem sikerült.');
    } catch (e: any) {
      setListError(e?.message || 'Hálózati hiba.');
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const importPost = async (payload: { postId?: string; url?: string }, busyKey: string) => {
    setBusy(busyKey);
    setResult(null);
    try {
      const res = await fetch('/api/import-fb-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setResult({
          ok: true,
          msg: `Hír létrehozva: „${j.title}”${j.hadImage ? ' (képpel)' : ' (kép nélkül)'}. Nyisd meg a Hírek között, nézd át és publikáld.`,
        });
        setUrl('');
      } else {
        setResult({ ok: false, msg: j.error || 'Ismeretlen hiba.' });
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || 'Hálózati hiba.' });
    } finally {
      setBusy('');
    }
  };

  const dateLabel = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <Card padding={4} style={{ minHeight: '100%' }}>
      <Stack space={4} style={{ maxWidth: 760 }}>
        <Stack space={2}>
          <Heading size={2}>Facebook hír import</Heading>
          <Text muted size={1}>
            Válaszd ki az oldal egyik friss posztját, és egy kattintással hírt készítünk belőle
            (szöveg + kép). Utána a „Hírek” között átnézheted és publikálhatod.
          </Text>
        </Stack>

        {result && (
          <Card padding={3} radius={2} tone={result.ok ? 'positive' : 'critical'} border>
            <Flex gap={3} align="center">
              <Badge tone={result.ok ? 'positive' : 'critical'}>{result.ok ? 'Kész' : 'Hiba'}</Badge>
              <Text size={1}>{result.msg}</Text>
            </Flex>
          </Card>
        )}

        <Stack space={3}>
          <Flex align="center" gap={3}>
            <Heading size={1}>Friss posztok</Heading>
            <Button text="Frissítés" mode="ghost" onClick={loadPosts} disabled={posts === null} />
          </Flex>

          {listError && (
            <Card padding={3} radius={2} tone="critical" border>
              <Text size={1}>{listError}</Text>
            </Card>
          )}

          {posts === null && !listError ? (
            <Flex align="center" gap={2}><Spinner /><Text size={1}>Posztok betöltése…</Text></Flex>
          ) : (
            <Stack space={2}>
              {(posts || []).map((p) => {
                const snippet = p.message.replace(/\s+/g, ' ').trim();
                return (
                  <Card key={p.id} padding={3} radius={2} border>
                    <Flex gap={3} align="center">
                      {p.picture ? (
                        <img
                          src={p.picture}
                          alt=""
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                        />
                      ) : (
                        <Box style={{ width: 72, height: 72, borderRadius: 6, background: 'var(--card-border-color)', flexShrink: 0 }} />
                      )}
                      <Stack space={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size={0} muted>{dateLabel(p.createdTime)}</Text>
                        <Text size={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {snippet || <em>(nincs szöveg, csak kép)</em>}
                        </Text>
                      </Stack>
                      <Button
                        text={busy === p.id ? 'Importálás…' : 'Importálás'}
                        tone="primary"
                        disabled={busy !== ''}
                        onClick={() => importPost({ postId: p.id }, p.id)}
                        style={{ flexShrink: 0 }}
                      />
                    </Flex>
                  </Card>
                );
              })}
              {posts && posts.length === 0 && <Text muted size={1}>Nincs megjeleníthető poszt.</Text>}
            </Stack>
          )}
        </Stack>

        <Stack space={3}>
          <Heading size={1}>Vagy illeszd be a link</Heading>
          <Text muted size={1}>
            Csak a régi, számot tartalmazó linkek működnek (pl. <code>/posts/1538956828264206</code>).
            A mai <code>pfbid…</code> linkeket a Facebook API nem tudja feloldani, ezért azokhoz
            használd a fenti listát.
          </Text>
          <Flex gap={2} align="center">
            <div style={{ flex: 1 }}>
              <TextInput
                value={url}
                onChange={(e) => setUrl(e.currentTarget.value)}
                placeholder="https://www.facebook.com/…/posts/1538956828264206"
                disabled={busy !== ''}
              />
            </div>
            <Button
              text={busy === 'url' ? 'Importálás…' : 'Importálás'}
              mode="ghost"
              disabled={busy !== '' || url.trim().length < 8}
              onClick={() => importPost({ url }, 'url')}
            />
          </Flex>
        </Stack>
      </Stack>
    </Card>
  );
}
