import {defineField, defineType} from 'sanity'

export const imprint = defineType({
  name: 'imprint',
  title: 'Imprint Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'imprint',
      title: 'Imprint',
      type: 'portableText',
    }),
    defineField({
      name: 'dataPolicy',
      title: 'Data Policy',
      type: 'portableText',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Imprint Page'}),
  },
})
