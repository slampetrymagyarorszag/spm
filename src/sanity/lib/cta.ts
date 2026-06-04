export type CtaSettings = {
  championshipCtaEnabled?: boolean;
  championshipCtaFrom?: string;
  championshipCtaTo?: string;
};
export function isCtaActive(s: CtaSettings, now: Date = new Date()): boolean {
  if (!s.championshipCtaEnabled) return false;
  if (s.championshipCtaFrom && now < new Date(s.championshipCtaFrom)) return false;
  if (s.championshipCtaTo && now >= new Date(s.championshipCtaTo)) return false;
  return true;
}
