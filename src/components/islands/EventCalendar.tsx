import { useMemo, useState } from 'react';

export type CalEvent = { title: string; slug: string; startsAt: string };

const MONTHS = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
];
const DOW = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

// Hétfő-kezdésű index (0 = hétfő … 6 = vasárnap)
const mondayIndex = (jsDay: number) => (jsDay + 6) % 7;
const keyOf = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

export default function EventCalendar({ events }: { events: CalEvent[] }) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const d = new Date(e.startsAt);
      const k = keyOf(d.getFullYear(), d.getMonth(), d.getDate());
      (map.get(k) ?? map.set(k, []).get(k)!).push(e);
    }
    return map;
  }, [events]);

  const { cells, monthEvents } = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const lead = mondayIndex(first.getDay());
    const cells: ({ day: number; evs: CalEvent[] } | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, evs: byDay.get(keyOf(view.y, view.m, d)) ?? [] });
    }
    const monthEvents = events
      .filter((e) => {
        const d = new Date(e.startsAt);
        return d.getFullYear() === view.y && d.getMonth() === view.m;
      })
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return { cells, monthEvents };
  }, [view, byDay, events]);

  const isToday = (d: number) =>
    view.y === now.getFullYear() && view.m === now.getMonth() && d === now.getDate();

  const shift = (delta: number) =>
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  return (
    <div className="rounded-2xl border border-white/10 bg-ink p-5 text-surface">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl">
          {MONTHS[view.m]} <span className="text-accent">{view.y}</span>
        </h3>
        <div className="flex gap-2">
          <button onClick={() => shift(-1)} aria-label="Előző hónap"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition hover:border-accent hover:text-accent">‹</button>
          <button onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}
            className="rounded-full border border-white/15 px-3 text-xs uppercase tracking-wide transition hover:border-accent hover:text-accent">Ma</button>
          <button onClick={() => shift(1)} aria-label="Következő hónap"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition hover:border-accent hover:text-accent">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] uppercase tracking-wide text-surface/50">
        {DOW.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const has = cell.evs.length > 0;
          const inner = (
            <div className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition
              ${has ? 'bg-accent text-ink font-semibold shadow-[0_0_18px_-2px_var(--color-accent)] hover:scale-[1.06]'
                    : isToday(cell.day) ? 'border border-accent/60 text-surface' : 'text-surface/60'}`}>
              {cell.day}
              {cell.evs.length > 1 && <span className="absolute bottom-1 text-[0.6rem]">●{cell.evs.length}</span>}
            </div>
          );
          return has ? (
            <a key={i} href={`/esemenyek/${cell.evs[0].slug}`} title={cell.evs.map((e) => e.title).join(', ')}>{inner}</a>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>

      {monthEvents.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
          {monthEvents.map((e) => {
            const d = new Date(e.startsAt);
            return (
              <li key={e.slug}>
                <a href={`/esemenyek/${e.slug}`} className="group flex items-center gap-3 text-sm">
                  <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-accent/15 font-display text-accent">{d.getDate()}</span>
                  <span className="font-display transition group-hover:text-accent">{e.title}</span>
                  <span className="ml-auto text-xs text-surface/50">{d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
