import {defineField, defineType} from 'sanity'

export const destinationsPage = defineType({
  name: 'destinationsPage',
  title: 'Destinations Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'marqueeText',
      title: 'Text für das durchlaufende Band',
      type: 'string',
    }),
    defineField({name: 'text', type: 'portableText'}),
  ],
  preview: {
    prepare: () => ({title: 'Destinations Seite'}),
  },
})
