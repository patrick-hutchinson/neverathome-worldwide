import {defineField, defineType} from 'sanity'

export const imprint = defineType({
  name: 'imprint',
  title: 'Imprint Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'marqueeText',
      title: 'Text für das durchlaufende Band',
      type: 'string',
    }),
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
    defineField({
      name: 'privacyPolicyFile',
      title: 'NAH Privacy Policy',
      type: 'file',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Imprint Page'}),
  },
})
