import {defineField, defineType} from 'sanity'

export const destinationsPage = defineType({
  name: 'destinationsPage',
  title: 'Destinations Seite',
  type: 'document',

  fields: [defineField({name: 'deadline', type: 'datetime'})],
  preview: {
    prepare: () => ({title: 'Destinations Seite'}),
  },
})
