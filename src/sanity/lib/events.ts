import type { EventListItem } from './api';
export function isUpcoming(e: EventListItem, now: Date = new Date()): boolean {
  return new Date(e.startsAt).getTime() >= now.getTime();
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
