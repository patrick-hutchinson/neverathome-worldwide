import {defineField, defineType} from 'sanity'

export const openCall = defineType({
  name: 'openCallPage',
  title: 'Open Call Seite',
  type: 'document',

  fields: [defineField({name: 'deadline', type: 'datetime'})],
  preview: {
    prepare: () => ({title: 'Open Call Seite'}),
  },
})
