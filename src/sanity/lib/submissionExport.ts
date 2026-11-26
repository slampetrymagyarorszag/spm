const clubLabelPrefix = 'club:';
export const unlabelledClub = 'unlabelled';

type SubmissionFilterRow = {
  kind?: string;
  contextLabel?: string;
  submittedAt?: string;
};

export function clubFilterKey(row: SubmissionFilterRow): string | undefined {
  if (row.kind !== 'havi-klub') return undefined;
  const label = row.contextLabel?.trim().normalize();
  return label ? clubLabelPrefix + label : unlabelledClub;
}

export function getClubOptions(rows: SubmissionFilterRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = clubFilterKey(row);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => Number(left === unlabelledClub) - Number(right === unlabelledClub))
    .map(([key, count]) => ({
      key,
      count,
      label: key === unlabelledClub ? 'Klubmegnevezés nélkül' : key.slice(clubLabelPrefix.length),
    }));
}

const monthFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit',
});

export function submissionMonth(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return monthFormatter.format(date);
}

export function submissionDate(value: string) {
  return new Date(value).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' });
}

export function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  // A beküldött szöveget a táblázatkezelő is szövegként olvassa.
  const safe = /^\s*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return /[",\r\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
