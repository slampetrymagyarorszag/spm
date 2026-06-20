import { defineField, defineType } from 'sanity';

// Egységes jelentkezés-napló: a havi klub és az országos bajnokság jelentkezései
// ide is bekerülnek (az emailen felül), időbélyeggel — így időrendben átláthatók és
// egy gombbal CSV/Excel formátumban exportálhatók (Studio → „Jelentkezések export”).
export const formSubmission = defineType({
  name: 'formSubmission',
  title: 'Jelentkezés',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'kind', title: 'Típus', type: 'string',
      options: { list: [
        { title: 'Havi klub', value: 'havi-klub' },
        { title: 'Országos bajnokság', value: 'bajnoksag' },
      ] },
    }),
    defineField({ name: 'submittedAt', title: 'Beküldve', type: 'datetime' }),
    defineField({ name: 'name', title: 'Név', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'stageName', title: 'Művésznév', type: 'string' }),
    defineField({ name: 'entryType', title: 'Jelentkezés típusa (verseny/open mic)', type: 'string' }),
    defineField({ name: 'contextLabel', title: 'Mire jelentkezett (hónap / esemény)', type: 'string' }),
    defineField({ name: 'achievements', title: 'Eddigi eredmények', type: 'text', rows: 3 }),
    defineField({ name: 'unavailableDay', title: 'Nem megfelelő nap', type: 'text', rows: 2 }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { name: 'name', stageName: 'stageName', kind: 'kind', submittedAt: 'submittedAt', context: 'contextLabel' },
    prepare: ({ name, stageName, kind, submittedAt, context }: any) => ({
      title: name || stageName || 'Jelentkezés',
      subtitle:
        (kind === 'bajnoksag' ? '🏆 Bajnokság' : '🎤 Havi klub') +
        (context ? ` · ${context}` : '') +
        (submittedAt ? ` · ${new Date(submittedAt).toLocaleString('hu-HU')}` : ''),
    }),
  },
});
