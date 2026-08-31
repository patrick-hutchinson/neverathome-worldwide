import {defineField, defineType} from 'sanity'

export const juryPage = defineType({
  name: 'juryPage',
  title: 'Jury Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'marqueeText',
      title: 'Text für das durchlaufende Band',
      type: 'string',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Jury Seite'}),
  },
})
