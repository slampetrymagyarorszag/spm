import type { Lang } from '../i18n';
import { educationDetails } from './education-details';

export const educationCopy = {
  hu: {
    ...educationDetails.hu,
    eyebrow: 'Oktatási és kulturális intézményeknek', title: 'Adj hangot az irodalomnak.',
    lead: 'Hívjátok meg a Slam Poetry Magyarországot egy rendhagyó irodalomórára vagy kreatív írás / előadói workshopra. Kortárs költészet, saját szövegek, élő megszólalás – az intézményetekhez és a résztvevőkhöz igazított alkalmon.',
    cta: 'Beszéljünk egy rendhagyó óráról', what: 'Mi az a slam poetry?',
    hint: 'Minden hang máshonnan indul.', benefitsLabel: 'Miért éppen slam?',
    benefits: [
      { title: 'Kortárs irodalom.', text: 'Élő szövegeken keresztül kapcsoljuk össze a slamet a költői képekkel, versformákkal és rímképletekkel. A műfajok közötti határok is izgalmas beszélgetések kiindulópontjai lehetnek.' },
      { title: 'Alkotás és szerkesztés.', text: 'A workshopon az ötlettől a szöveg alakításáig dolgozunk a résztvevőkkel. Az egyéni nézőpont mellett a közös írás és a team slam is teret kaphat.' },
      { title: 'Hang és jelenlét.', text: 'Megmutatjuk, hogyan formálja a jelentést a hangsúly, a tempó vagy a szünet. A hangos próba az íráshoz is visszajelzést ad.' },
      { title: 'Saját nézőpont.', text: 'Teret adunk a saját gondolatok megfogalmazásának és mások meghallgatásának. Az önismeret és a kritikus gondolkodás a szövegekhez és a közös beszélgetéshez kapcsolódik.' },
    ],
    lessonLabel: 'Így dolgozunk együtt', lessonTitle: 'A szöveg és az előadás együtt alakul.',
    lessonText: 'Élő slam, közös értelmezés, beszélgetés és alkotás: ezek arányát a választott programhoz igazítjuk. A résztvevők különböző versformákkal, rímképletekkel és előadói eszközökkel találkozhatnak. A workshopon a saját szövegeken végzett munka és a hangos próba kerülhet előtérbe; a rendhagyó órán az irodalmi kapcsolódások és a közös gondolkodás kapnak hangsúlyt.',
    questions: ['Mit gondolok?', 'Miért gondolom így?', 'Hogyan mondjam el?'],
    reflection: 'A slam ezeknek a kérdéseknek is teret ad. Az irodalom mellett önismerettel, önkifejezéssel és kritikus gondolkodással is foglalkozunk.',
    processLabel: 'Így indul', steps: [
      { title: 'Kérd a tájékoztatót.', text: 'Elég megadnod az emailcímed.' },
      { title: 'Nézd meg a lehetőségeket.', text: 'Küldünk egy levelet és egy részletes, továbbküldhető tájékoztatót.' },
      { title: 'Beszéljük meg a részleteket.', text: 'Válaszolj a levélre: innen együtt folytatjuk az egyeztetést.' },
    ],
    formText: 'Elküldjük a rendhagyó órát és a workshopot bemutató levelet, a részletes PDF-fel együtt. A tájékoztatót továbbküldheted a kollégáidnak; a levélre válaszolva egyeztethetünk az intézményetekről és az elképzelésetekről. Első lépésként elég az emailcímed.',
    extra: 'Ha már van konkrét elképzelésed', name: 'Név', school: 'Intézmény és település', message: 'Mire gondoltál?', optional: 'opcionális',
    submit: 'Kérem a tájékoztatót', sending: 'Küldés…',
    success: 'A tájékoztató küldését elindítottuk. Ha megérkezett a levél, válaszolj rá, és megbeszéljük a részleteket.',
    error: 'Most nem sikerült elküldeni. Próbáld újra később.',
    preview: 'A tájékoztató emailes kérése még nem elérhető. Addig a kapcsolat oldalon tudsz érdeklődni.',
    contact: 'Kapcsolat', privacy: 'Az emailcímedet a tájékoztató elküldéséhez és az egyeztetéshez használjuk.',
    onepager: 'Slam poetry – ugródeszka az irodalomhoz',
  },
  en: {
    ...educationDetails.en,
    eyebrow: 'For educational and cultural institutions', title: 'Give literature a voice.',
    lead: 'Invite Slam Poetry Magyarország for a literature session or a creative writing / performance workshop. Contemporary poetry, original texts and live voices, shaped around your institution and participants.',
    cta: 'Let’s talk about a different kind of lesson', what: 'What is slam poetry?',
    hint: 'Every voice starts somewhere.', benefitsLabel: 'Why slam?',
    benefits: [
      { title: 'Contemporary literature.', text: 'Live texts connect slam with imagery, verse forms and rhyme schemes. The boundaries between genres can also start a conversation.' },
      { title: 'Writing and editing.', text: 'In a workshop, we work with participants from ideas to shaping texts. Individual perspectives, collaborative writing and team slam can all have a place.' },
      { title: 'Voice and presence.', text: 'We explore how emphasis, pace and pauses shape meaning. Trying a text aloud also gives feedback on the writing.' },
      { title: 'Your own perspective.', text: 'We make space for articulating thoughts and listening to others. Self-awareness and critical thinking connect to texts and shared discussion.' },
    ],
    lessonLabel: 'How we work together', lessonTitle: 'Writing and performance shape each other.',
    lessonText: 'Live slam, shared interpretation, conversation and writing: we balance these around the selected programme. Participants can explore verse forms, rhyme schemes and performance techniques. Workshops can focus on original texts and trying them aloud; literature sessions foreground literary connections and shared discussion.',
    questions: ['What do I think?', 'Why do I think that?', 'How do I say it?'],
    reflection: 'Slam makes room for these questions too. Alongside literature, we explore self-awareness, self-expression and critical thinking.',
    processLabel: 'Getting started', steps: [
      { title: 'Ask for the information.', text: 'Your email address is all we need to start.' },
      { title: 'Explore the possibilities.', text: 'We’ll send an email and a detailed guide you can share with colleagues.' },
      { title: 'Let’s talk about the details.', text: 'Reply to the email and we’ll take it from there together.' },
    ],
    formText: 'We’ll email an introduction to our literature session and workshop, with the detailed PDF attached. Share it with colleagues and reply to discuss your institution and ideas. Your email address is all we need to begin.',
    extra: 'Already have something in mind?', name: 'Name', school: 'Institution and town', message: 'What do you have in mind?', optional: 'optional',
    submit: 'Send me the information', sending: 'Sending…',
    success: 'We’ve submitted your information email for sending. Once it arrives, reply to discuss the details.',
    error: 'We couldn’t send the email. Please try again later.',
    preview: 'The information email is not available yet. In the meantime, please use our contact page.',
    contact: 'Contact', privacy: 'We use your email address to send the information and discuss your enquiry.',
    onepager: 'Slam poetry – a springboard to literature',
  },
} satisfies Record<Lang, object>;

export type EducationCopy = typeof educationCopy.hu;
export type EducationInput = { email: string; name: string; school: string; message: string; lang: Lang; program?: 'lesson' | 'workshop' };

export function parseEducationInput(value: unknown): EducationInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (data.program !== undefined && data.program !== '' && data.program !== 'lesson' && data.program !== 'workshop') return null;
  const limits = { email: 254, name: 120, school: 240, message: 3000 };
  for (const [key, max] of Object.entries(limits)) {
    if (data[key] !== undefined && (typeof data[key] !== 'string' || (data[key] as string).length > max)) return null;
  }
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || /[\r\n]/.test(email)) return null;
  return { email, name: String(data.name ?? '').trim(), school: String(data.school ?? '').trim(), message: String(data.message ?? '').trim(), lang: data.lang === 'en' ? 'en' : 'hu', ...(data.program === 'lesson' || data.program === 'workshop' ? { program: data.program } : {}) };
}

export function educationEnabled() {
  return (import.meta.env.EDUCATION_EMAIL_ENABLED ?? process.env.EDUCATION_EMAIL_ENABLED) === 'true'
    && Boolean(import.meta.env.EDUCATION_REPLY_TO ?? process.env.EDUCATION_REPLY_TO);
}
