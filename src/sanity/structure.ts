import type { StructureResolver } from 'sanity/structure';
import { SubmissionsExportTool } from './tools/SubmissionsExportTool';
import { FacebookImportTool } from './tools/FacebookImportTool';
import { PressReleaseTool } from './tools/PressReleaseTool';
import { RegistrationSettingsTool } from './tools/RegistrationSettingsTool';

export const structure: StructureResolver = S => {
  const filtered = (id: string, title: string, type: string, condition = '', field = 'submittedAt', direction: 'asc' | 'desc' = 'desc') => S.listItem().id(id).title(title).child(
    S.documentList().id(id).title(title).schemaType(type).filter(`_type == "${type}"${condition ? ` && ${condition}` : ''}`).defaultOrdering([{ field, direction }]),
  );
  const tool = (id: string, title: string, component: any) => S.listItem().id(id).title(title).child(S.component(component).id(id).title(title));
  const group = (id: string, title: string, items: any[]) => S.listItem().id(id).title(title).child(S.list().id(id).title(title).items(items));
  return S.list().title('Mit szeretnél szerkeszteni?').items([
    group('news', 'Hírek', [
      S.documentTypeListItem('post').title('Összes hír és piszkozat').child(S.documentTypeList('post').title('Összes hír és piszkozat').defaultOrdering([{field:'publishedAt',direction:'desc'}])),
      tool('facebook-import', 'Hír átvétele Facebookról', FacebookImportTool),
    ]),
    group('events', 'Eseménynaptár', [
      filtered('upcoming', 'Közelgő események', 'event', 'coalesce(endsAt, startsAt) >= now()', 'startsAt', 'asc'),
      S.documentTypeListItem('event').title('Összes esemény és új esemény'),
      filtered('past', 'Korábbi események', 'event', 'coalesce(endsAt, startsAt) < now()', 'startsAt'),
    ]),
    group('slammers', 'Slammerek', [
      S.documentTypeListItem('slammer').title('Összes profil és új slammer'),
      filtered('featured', 'Főoldali kiemelés és sorrend', 'slammer', 'featured == true', 'featuredOrder', 'asc'),
    ]),
    S.documentTypeListItem('mediaItem').title('Médiatár'),
    S.divider(),
    group('requests', 'Beérkezett kérések', [
      group('edits', 'Meglévő slammer profiljavítása', [
        filtered('open', 'Feldolgozásra vár', 'slammerEditRequest', 'coalesce(handled, false) == false'),
        filtered('closed', 'Lezárt kérések', 'slammerEditRequest', 'handled == true'),
      ]),
      group('applications', 'Új slammer jelentkezése', [
        filtered('open', 'Feldolgozásra vár', 'slammerApplication', 'coalesce(promoted, false) == false'),
        filtered('closed', 'Létrehozott profilok', 'slammerApplication', 'promoted == true'),
      ]),
      group('tips', 'Beküldött eseménytippek', [
        filtered('open', 'Elbírálásra vár', 'eventTip', 'coalesce(approved, false) == false && coalesce(promoted, false) == false'),
        filtered('approved', 'Közösségi tippként megjelenik', 'eventTip', 'approved == true && coalesce(promoted, false) == false'),
        filtered('promoted', 'Elkészített eseménypiszkozatok', 'eventTip', 'promoted == true'),
      ]),
      group('clubs', 'Klubok jóváhagyása', [
        filtered('open', 'Elbírálásra vár', 'slamClub', 'coalesce(approved, false) == false'),
        filtered('approved', 'Megjelenő klubok', 'slamClub', 'approved == true', 'city', 'asc'),
      ]),
    ]),
    group('registrations', 'Versenyjelentkezések', [
      tool('settings', 'Jelentkezés megnyitása és lezárása', RegistrationSettingsTool),
      tool('export', 'Jelentkezők és Excel / CSV export', SubmissionsExportTool),
      filtered('all', 'Összes beküldés (napló)', 'formSubmission'),
      filtered('monthly', 'Havi klub beküldései', 'formSubmission', 'kind == "havi-klub"'),
      filtered('championship', 'Bajnokság beküldései', 'formSubmission', 'kind == "bajnoksag"'),
    ]),
    S.divider(),
    group('website', 'Oldalszövegek és beállítások', [
      S.documentTypeListItem('page').title('Oldalak szövegei'),
      S.listItem().id('education').title('Oktatás').child(S.document().schemaType('educationPage').documentId('educationPage')),
      S.listItem().id('settings').title('Főoldal, kapcsolatok és médiatár beállításai').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]),
    group('press', 'Sajtó', [
      filtered('subscribed', 'Feliratkozott sajtókapcsolatok', 'pressContact', 'coalesce(subscribed, true) == true', 'name', 'asc'),
      S.documentTypeListItem('pressContact').title('Összes sajtókapcsolat'),
      tool('send', 'Sajtóközlemény összeállítása és küldése', PressReleaseTool),
    ]),
  ]);
};
