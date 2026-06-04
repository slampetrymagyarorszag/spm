import { defineField, defineType } from 'sanity';
export const location = defineType({
  name: 'location', title: 'Helyszín', type: 'object',
  fields: [
    defineField({ name: 'name', title: 'Név', type: 'string' }),
    defineField({ name: 'address', title: 'Cím', type: 'string' }),
    defineField({ name: 'mapUrl', title: 'Térkép URL', type: 'url' }),
  ],
});
