import type { Lang } from './index';

// Lapos kulcs→szöveg szótár. Új UI-szöveg felvételekor MINDKÉT nyelvhez add hozzá.
export const ui: Record<Lang, Record<string, string>> = {
  hu: {
    'nav.whatIsSlam': 'Mi az a slam?',
    'nav.events': 'Események',
    'nav.slammers': 'Slammerek',
    'nav.news': 'Hírek',
    'nav.media': 'Médiatár',
    'nav.association': 'Egyesület',
    'nav.contact': 'Kapcsolat',
    'lang.switchTo': 'English',
    'footer.impressum': 'Impresszum',
    'footer.contact': 'Kapcsolat',
    'footer.transparency': 'Átláthatóság',
    'footer.annualReports': 'Éves beszámolók',
    'footer.annualReportsSoon': 'Éves beszámolók (hamarosan)',
    'footer.getInTouch': 'Lépj kapcsolatba velünk →',
    'common.readMore': 'Tovább',
    'common.watchOnYoutube': 'Megnézem YouTube-on',
    'error404.title': 'Az oldal nem található',
    'error404.lead': 'Ez a vers nem rímel — a keresett oldal nincs meg.',
    'error404.home': 'Vissza a főoldalra',
  },
  en: {
    'nav.whatIsSlam': 'What is slam?',
    'nav.events': 'Events',
    'nav.slammers': 'Slammers',
    'nav.news': 'News',
    'nav.media': 'Media',
    'nav.association': 'Association',
    'nav.contact': 'Contact',
    'lang.switchTo': 'Magyar',
    'footer.impressum': 'Imprint',
    'footer.contact': 'Contact',
    'footer.transparency': 'Transparency',
    'footer.annualReports': 'Annual reports',
    'footer.annualReportsSoon': 'Annual reports (coming soon)',
    'footer.getInTouch': 'Get in touch →',
    'common.readMore': 'Read more',
    'common.watchOnYoutube': 'Watch on YouTube',
    'error404.title': 'Page not found',
    'error404.lead': 'This verse doesn\'t rhyme — the page you\'re looking for is gone.',
    'error404.home': 'Back to home',
  },
};

// Kulcs feloldása. Hiányzó EN kulcsnál HU-ra esik vissza; ha az sincs, a kulcsot adja.
export function t(lang: Lang, key: string): string {
  return ui[lang]?.[key] ?? ui.hu[key] ?? key;
}
