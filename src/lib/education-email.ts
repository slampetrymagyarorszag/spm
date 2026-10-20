import { escapeHtml as esc } from './escape';
import { educationCopy, type EducationInput } from './education';

export function educationEmail(input: EducationInput, onepagerUrl?: string) {
  const c = educationCopy[input.lang];
  const en = input.lang === 'en';
  const greeting = input.name ? `${en ? 'Hello' : 'Szia'} ${esc(input.name)}!` : en ? 'Hello!' : 'Szia!';
  return `<div style="font-family:Arial,sans-serif;max-width:620px;line-height:1.7;color:#17171c">
    <p>${greeting}</p><p>${en ? 'Thanks for your interest. You can invite Slam Poetry Magyarország for a literature session or a creative writing / performance workshop.' : 'Köszönjük az érdeklődésed! A Slam Poetry Magyarországot rendhagyó irodalomórára és külön kreatív írás / előadói workshopra is meghívhatjátok.'}</p>
    ${input.program ? `<p><strong>${c.interestLabel}</strong> ${esc(c.programs.find(program => program.id === input.program)!.label)}</p>` : ''}
    ${c.programs.map(program => `<h2>${esc(program.label)}</h2><p>${esc(program.text)}</p><p>${esc(program.detail)}</p>`).join('')}
    <h2>${esc(c.lessonTitle)}</h2><p>${esc(c.lessonText)}</p>
    <h3>${esc(c.questions.join(' '))}</h3><p>${esc(c.reflection)}</p>
    <p>${en ? 'We’ll discuss the age group, duration, group size, location and practical arrangements together.' : 'A korosztályt, az időtartamot, a létszámot, a helyszínt és a gyakorlati tudnivalókat személyesen egyeztetjük.'}</p>
    <p>${en ? 'Slam can also connect with the work of libraries, community arts centres and other cultural institutions. We’ll discuss the audience and focus together.' : 'A slam könyvtárak, művelődési központok és más kulturális intézmények munkájához is kapcsolódhat. A közönséget és a tartalmi fókuszt együtt egyeztetjük.'}</p>
    <p>${en ? 'The attached PDF explains the programme in more detail. Feel free to share it with colleagues.' : 'A csatolt PDF-ben részletesen bemutatjuk a programot. A tájékoztatót a kollégáidnak is továbbküldheted.'}</p>
    ${onepagerUrl ? `<p><a href="${esc(onepagerUrl)}" style="color:#9227b3">${en ? 'Download the guide' : 'A tájékoztató letöltése'}</a></p>` : ''}
    ${input.school || input.message ? `<p>${en ? 'Your enquiry:' : 'Ezt írtad nekünk:'}</p><blockquote>${esc(input.school)}<br>${esc(input.message).replace(/\n/g, '<br>')}</blockquote>` : ''}
    <p>${en ? 'Reply to this email with your institution, town and what you have in mind, and we’ll discuss what would suit your audience.' : 'Válaszolj erre a levélre az intézménnyel, a településsel és az elképzeléseddel, és megbeszéljük, mi illene a közönségetekhez.'}</p>
    <p style="margin-top:28px"><strong>Vajna Balázs</strong><br>${c.role}<br>Slam Poetry Magyarország<br><a href="mailto:oktatas@slampoetry.hu" style="color:#9227b3">oktatas@slampoetry.hu</a><br><a href="tel:+36302318087" style="color:#17171c">06302318087</a></p></div>`;
}
