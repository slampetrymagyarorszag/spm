const measurementId = 'G-5C2MJJBY5L';
const preferenceKey = 'spm-analytics-consent-v1';
const disableKey = `ga-disable-${measurementId}` as const;

type Preference = 'accepted' | 'declined';
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  [disableKey]?: boolean;
};

let enabled = false;
const analyticsWindow = () => window as AnalyticsWindow;

export function getAnalyticsPreference(): Preference | null {
  try {
    const saved = localStorage.getItem(preferenceKey);
    return saved === 'accepted' || saved === 'declined' ? saved : null;
  } catch {
    return null;
  }
}

function gtag(..._parameters: unknown[]) {
  // The Google tag consumes arguments objects from its queue.
  (analyticsWindow().dataLayer ??= []).push(arguments);
}

export function startAnalytics() {
  if (enabled || location.origin !== 'https://slampoetry.hu') return;
  enabled = true;
  analyticsWindow()[disableKey] = false;

  const page = new URL(location.pathname, location.origin);
  const referrer = document.referrer ? new URL(document.referrer).origin : '';
  gtag('js', new Date());
  gtag('config', measurementId, {
    page_location: page.href,
    page_referrer: referrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: 'slampoetry.hu',
    cookie_expires: 90 * 86400,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
}

export function setAnalyticsPreference(preference: Preference) {
  try {
    localStorage.setItem(preferenceKey, preference);
  } catch {
    // A browser that blocks storage can still choose for this page.
  }

  if (preference === 'accepted') {
    startAnalytics();
    return;
  }

  analyticsWindow()[disableKey] = true;
  const wasEnabled = enabled;
  enabled = false;
  for (const name of ['_ga', `_ga_${measurementId.slice(2)}`]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; Secure`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=slampoetry.hu; Secure`;
  }
  if (wasEnabled) location.reload();
}

export function trackRegistration(kind: 'event' | 'championship' | 'monthly_contest') {
  if (enabled) gtag('event', 'registration_success', { registration_type: kind });
}

export function trackTicketClick(eventSlug: string) {
  if (enabled) gtag('event', 'ticket_link_click', { event_slug: eventSlug });
}
