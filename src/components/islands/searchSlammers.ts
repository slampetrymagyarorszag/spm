import type { SlammerListItem } from '../../sanity/lib/api';

export function filterSlammers(list: SlammerListItem[], q: string): SlammerListItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((s) =>
    s.name.toLowerCase().includes(needle) ||
    (s.hometown?.toLowerCase().includes(needle) ?? false)
  );
}
