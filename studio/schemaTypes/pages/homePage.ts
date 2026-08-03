import {defineField, defineType} from 'sanity'

const scheduleEntry = {
  type: 'object',
  fieldsets: [{name: 'dates', title: 'Datum', options: {columns: 2}}],
  fields: [
    defineField({
      name: 'date',
      title: 'Von',
      description: 'Startdatum ist verpflichtend.',
      type: 'date',
      fieldset: 'dates',
    }),
    defineField({
      name: 'endDate',
      title: 'Bis',
      description: 'Enddatum ist optional.',
      type: 'date',
      fieldset: 'dates',
    }),
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
    }),
    defineField({
      name: 'keyword',
      title: 'Keyword',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      date: 'date',
      endDate: 'endDate',
      keyword: 'keyword',
      title: 'title',
    },
    prepare: ({
      date,
      endDate,
      keyword,
      title,
    }: {
      date?: string
      endDate?: string
      keyword?: string
      title?: string
    }) => ({
      title: title || keyword || 'Fahrplan Eintrag',
      subtitle: [[date, endDate].filter(Boolean).join(' - '), keyword].filter(Boolean).join(' · '),
    }),
  },
}

const quoteEntry = {
  type: 'object',
  fields: [
    defineField({name: 'text', title: 'Text', type: 'portableText'}),
    defineField({name: 'person', title: 'Person', type: 'string'}),
    defineField({name: 'role', title: 'Rolle', type: 'string'}),
  ],
  preview: {
    select: {
      person: 'person',
      role: 'role',
    },
    prepare: ({person, role}: {person?: string; role?: string}) => ({
      title: person || 'Zitat',
      subtitle: role,
    }),
  },
}

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'aboutText',
      title: 'About (Text)',
      type: 'portableText',
    }),

    defineField({
      name: 'schedule',
      title: 'Fahrplan',
      type: 'object',
      fields: [
        defineField({
          name: 'phaseA',
          title: 'Phase A',
          type: 'array',
          of: [scheduleEntry],
        }),
        defineField({
          name: 'phaseB',
          title: 'Phase B',
          type: 'array',
          of: [scheduleEntry],
        }),
        defineField({
          name: 'phaseC',
          title: 'Phase C',
          type: 'array',
          of: [scheduleEntry],
        }),
      ],
    }),

    defineField({
      name: 'quotes',
      title: 'Zitate',
      type: 'array',
      of: [quoteEntry],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Home Page'}),
  },
})
