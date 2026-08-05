import { useCallback, useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Card, Stack, Heading, Text, Button, Flex, Box, Spinner, Select } from '@sanity/ui';

type Row = {
  _id: string;
  kind?: string;
  submittedAt?: string;
  name?: string;
  email?: string;
  stageName?: string;
  entryType?: string;
  contextLabel?: string;
  achievements?: string;
  availableDays?: string[];
  note?: string;
  unavailableDay?: string;
};

const COLUMNS: { key: keyof Row; label: string }[] = [
  { key: 'kind', label: 'Típus' },
  { key: 'submittedAt', label: 'Beküldve' },
  { key: 'name', label: 'Név' },
  { key: 'email', label: 'Email' },
  { key: 'stageName', label: 'Művésznév' },
  { key: 'entryType', label: 'Jelentkezés típusa' },
  { key: 'contextLabel', label: 'Mire jelentkezett' },
  { key: 'availableDays', label: 'Megfelelő napok' },
  { key: 'note', label: 'Megjegyzés' },
  { key: 'achievements', label: 'Eddigi eredmények' },
  { key: 'unavailableDay', label: 'Nem megfelelő nap' },
];

const kindLabel = (k?: string) => (k === 'bajnoksag' ? 'Országos bajnokság' : k === 'havi-klub' ? 'Havi klub' : k || '');

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function SubmissionsExportTool() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'havi-klub' | 'bajnoksag'>('all');
  // Kétlépcsős törlés: az első kattintás csak felfedi a megerősítő gombot.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const data = await client.fetch<Row[]>(
      '*[_type == "formSubmission"] | order(submittedAt desc){_id,kind,submittedAt,name,email,stageName,entryType,contextLabel,achievements,availableDays,note,unavailableDay}',
    );
    setRows(data || []);
  }, [client]);

  useEffect(() => { load(); }, [load]);

  const visible = (rows || []).filter((r) => filter === 'all' || r.kind === filter);

  // A törlés VÉGLEGES, és pontosan azt a listát törli, ami épp a képernyőn van (a szűrőt
  // is figyelembe véve) — így nem lehet véletlenül mást törölni, mint amit a szerkesztő lát.
  const deleteVisible = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const ids = visible.map((r) => r._id);
      for (let i = 0; i < ids.length; i += 50) {
        const tx = ids.slice(i, i + 50).reduce((t, id) => t.delete(id), client.transaction());
        await tx.commit({ visibility: 'async' });
      }
      setConfirmDelete(false);
      await load();
    } catch (e: any) {
      setDeleteError(e?.message || 'A törlés nem sikerült. Lehet, hogy nincs törlési jogod.');
    } finally {
      setDeleting(false);
    }
  };

  const downloadCsv = () => {
    const header = COLUMNS.map((c) => c.label).join(';');
    const lines = visible.map((r) =>
      COLUMNS.map((c) => {
        let v: any = r[c.key];
        if (c.key === 'kind') v = kindLabel(r.kind);
        if (c.key === 'submittedAt' && r.submittedAt) v = new Date(r.submittedAt).toLocaleString('hu-HU');
        if (Array.isArray(v)) v = v.join(', ');
        return csvCell(v);
      }).join(';'),
    );
    // BOM, hogy az Excel helyesen olvassa az ékezeteket; pontosvessző-elválasztó (HU Excel).
    const csv = '﻿' + [header, ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `jelentkezesek-${filter}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card padding={4} style={{ minHeight: '100%' }}>
      <Stack space={4}>
        <Stack space={2}>
          <Heading size={2}>Jelentkezések export</Heading>
          <Text muted size={1}>
            A havi klub és az országos bajnokság jelentkezései időrendben. Egy kattintással letöltheted CSV-ben
            (Excelből megnyitható).
          </Text>
        </Stack>

        <Flex gap={3} align="center">
          <Box style={{ minWidth: 220 }}>
            <Select value={filter} onChange={(e) => setFilter(e.currentTarget.value as any)}>
              <option value="all">Összes jelentkezés</option>
              <option value="havi-klub">Csak havi klub</option>
              <option value="bajnoksag">Csak országos bajnokság</option>
            </Select>
          </Box>
          <Button text="Frissítés" mode="ghost" onClick={load} />
          <Button text={`CSV letöltése (${visible.length})`} tone="primary" disabled={!rows || visible.length === 0} onClick={downloadCsv} />
          {!confirmDelete ? (
            <Button
              text="Törlés…"
              mode="ghost"
              tone="critical"
              disabled={!rows || visible.length === 0}
              onClick={() => { setConfirmDelete(true); setDeleteError(null); }}
            />
          ) : (
            <Flex gap={2} align="center">
              <Button
                text={deleting ? 'Törlés…' : `Igen, törlöm mind (${visible.length})`}
                tone="critical"
                disabled={deleting}
                onClick={deleteVisible}
              />
              <Button text="Mégse" mode="ghost" disabled={deleting} onClick={() => setConfirmDelete(false)} />
            </Flex>
          )}
        </Flex>

        {confirmDelete && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>
              <strong>Végleges törlés.</strong> A most listázott {visible.length} jelentkezés törlődik
              {filter === 'all' ? ' (mind a havi klub, mind a bajnokság)' : filter === 'bajnoksag' ? ' (csak az országos bajnokság)' : ' (csak a havi klub)'}.
              Ez nem vonható vissza — ha kell az adat, előbb töltsd le CSV-ben.
            </Text>
          </Card>
        )}

        {deleteError && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{deleteError}</Text>
          </Card>
        )}

        {rows === null ? (
          <Flex align="center" gap={2}><Spinner /><Text>Betöltés…</Text></Flex>
        ) : visible.length === 0 ? (
          <Text muted>Még nincs jelentkezés.</Text>
        ) : (
          <Box overflow="auto">
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  {COLUMNS.slice(0, 8).map((c) => (
                    <th key={c.key} style={{ textAlign: 'left', borderBottom: '1px solid var(--card-border-color)', padding: '6px 10px', whiteSpace: 'nowrap' }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r._id}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)' }}>{kindLabel(r.kind)}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)', whiteSpace: 'nowrap' }}>{r.submittedAt ? new Date(r.submittedAt).toLocaleString('hu-HU') : ''}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)' }}>{r.name}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)' }}>{r.email}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)' }}>{r.stageName}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)' }}>{r.entryType}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)' }}>{r.contextLabel}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--card-border-color)' }}>{(r.availableDays || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
