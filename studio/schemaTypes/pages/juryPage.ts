import {defineField, defineType} from 'sanity'

export const juryPage = defineType({
  name: 'juryPage',
  title: 'Jury Seite',
  type: 'document',

  fields: [defineField({name: 'deadline', type: 'datetime'})],
  preview: {
    prepare: () => ({title: 'Jury Seite'}),
  },
})
