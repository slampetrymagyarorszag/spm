import { defineField, defineType } from 'sanity';

const copyFields = [
  ['eyebrow', 'Oldalcímke'], ['title', 'Főcím'], ['lead', 'Bevezető'],
  ['lessonLabel', 'Órabemutató címkéje'], ['lessonTitle', 'Órabemutató címe'],
  ['lessonText', 'Órabemutató szövege'], ['reflection', 'Önismereti szöveg'], ['formText', 'Form magyarázata'],
  ['programsTitle', 'Két program főcíme'], ['programsIntro', 'Két program bevezetője'], ['institutionsTitle', 'Intézményi blokk címe'], ['faqTitle', 'Gyakorlati kérdések címe'], ['formTitle', 'Kapcsolatfelvétel címe'],
];
export const educationPage = defineType({
  name: 'educationPage', title: 'Oktatás oldal', type: 'document',
  fields: ['hu', 'en'].map((lang) => defineField({
    name: lang, title: lang === 'hu' ? 'Magyar szövegek' : 'English copy', type: 'object',
    description: 'Üres mezőnél az oldal alapértelmezett szövege jelenik meg.',
    fields: copyFields.map(([name, title]) => defineField({ name, title, type: ['lead', 'lessonText', 'reflection', 'formText', 'programsIntro'].includes(name) ? 'text' : 'string' })),
  })),
  preview: { prepare: () => ({ title: 'Oktatás oldal' }) },
});
