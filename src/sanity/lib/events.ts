import type { EventListItem } from './api';

/** Az esemény vége. Ha nincs megadva befejezés, a kezdés számít végnek is. */
export function eventEnd(e: Pick<EventListItem, 'startsAt'> & { endsAt?: string }): Date {
  const end = e.endsAt ? new Date(e.endsAt) : null;
  const start = new Date(e.startsAt);
  // Hibás vagy a kezdésnél korábbi befejezést figyelmen kívül hagyunk.
  return end && !Number.isNaN(end.getTime()) && end.getTime() > start.getTime() ? end : start;
}

/**
 * Egy többnapos esemény az UTOLSÓ napja végéig „közelgő" marad — különben a háromnapos
 * előválogató már a második napon eltűnne a közelgők közül, pedig még tart.
 */
export function isUpcoming(
  e: Pick<EventListItem, 'startsAt'> & { endsAt?: string },
  now: Date = new Date(),
): boolean {
  return eventEnd(e).getTime() >= now.getTime();
}

export function splitEvents(list: EventListItem[], now: Date = new Date()) {
  const upcoming = list
    .filter((e) => isUpcoming(e, now))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = list
    .filter((e) => !isUpcoming(e, now))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  return { upcoming, past };
}

/** Naptári napokon átnyúlik-e? (Nem az időtartam számít, hanem hogy másik napra esik a vége.) */
export function isMultiDay(e: Pick<EventListItem, 'startsAt'> & { endsAt?: string }): boolean {
  const s = new Date(e.startsAt);
  const t = eventEnd(e);
  return s.toDateString() !== t.toDateString();
}

/** Hány naptári napot érint (egynaposnál 1). */
export function eventDayCount(e: Pick<EventListItem, 'startsAt'> & { endsAt?: string }): number {
  const s = new Date(e.startsAt);
  const t = eventEnd(e);
  const a = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const b = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.floor((b - a) / 86400000) + 1;
}

/**
 * Az esemény által érintett naptári napok — a naptár-nézet ezekre teszi a jelölést,
 * hogy egy háromnapos esemény mindhárom napon látszódjon, ne csak a kezdőnapon.
 */
export function eventDays(e: Pick<EventListItem, 'startsAt'> & { endsAt?: string }): Date[] {
  const s = new Date(e.startsAt);
  const out: Date[] = [];
  for (let i = 0; i < eventDayCount(e); i++) {
    out.push(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
  }
  return out;
}

/**
 * Dátum-felirat. Egynapos: „2026. szeptember 25.". Többnapos: „2026. szeptember 25–27.",
 * hónapváltásnál „2026. október 30. – november 1.".
 *
 * A tartomány összefűzését az `Intl` `formatRange` végzi, nem kézi string-darabolás: az
 * ismétlődő hónap/év elhagyása nyelvenként más szabály (magyarul „szeptember 25–27.",
 * angolul „25 – 27 September 2026"), és ezt a szabvány pontosan tudja.
 */
export function formatEventDate(
  e: Pick<EventListItem, 'startsAt'> & { endsAt?: string },
  locale = 'hu-HU',
  opts: { year?: boolean } = {},
): string {
  const withYear = opts.year !== false;
  const fmt = new Intl.DateTimeFormat(locale, {
    ...(withYear ? { year: 'numeric' as const } : {}),
    month: 'long',
    day: 'numeric',
  });
  const s = new Date(e.startsAt);
  return isMultiDay(e) ? fmt.formatRange(s, eventEnd(e)) : fmt.format(s);
}

/** Hétköznap-felirat: egynaposnál „péntek", többnaposnál „péntek–vasárnap". */
export function formatEventWeekday(
  e: Pick<EventListItem, 'startsAt'> & { endsAt?: string },
  locale = 'hu-HU',
): string {
  const day = (d: Date) => d.toLocaleDateString(locale, { weekday: 'long' });
  const s = new Date(e.startsAt);
  return isMultiDay(e) ? `${day(s)}–${day(eventEnd(e))}` : day(s);
}

/** Rövid nap-felirat a kártyák nagy számához: „25." vagy „25–27.". */
export function formatEventDayBadge(
  e: Pick<EventListItem, 'startsAt'> & { endsAt?: string },
): string {
  const s = new Date(e.startsAt);
  if (!isMultiDay(e)) return String(s.getDate());
  return `${s.getDate()}–${eventEnd(e).getDate()}`;
}
