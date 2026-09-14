import {defineField, defineType} from 'sanity'

const scheduleDateField = (name: 'date' | 'endDate', title: string, description: string) =>
  defineField({
    name,
    title,
    description,
    type: 'object',
    fieldset: 'dates',
    fields: [
      defineField({
        name: 'precision',
        title: 'Genauigkeit',
        type: 'string',
        initialValue: 'day',
        options: {
          layout: 'radio',
          list: [
            {title: 'Tag bekannt', value: 'day'},
            {title: 'Nur Monat bekannt', value: 'month'},
            {title: 'Nur Jahr bekannt', value: 'year'},
          ],
        },
      }),
      defineField({
        name: 'value',
        title: 'Datum',
        type: 'date',
      }),
    ],
    preview: {
      select: {
        precision: 'precision',
        value: 'value',
      },
      prepare: ({precision, value}: {precision?: string; value?: string}) => ({
        title: value || 'Datum',
        subtitle: precision,
      }),
    },
  })

const scheduleEntry = {
  type: 'object',
  fieldsets: [{name: 'dates', title: 'Datum', options: {columns: 2}}],
  fields: [
    scheduleDateField(
      'date',
      'Von',
      'Startdatum ist verpflichtend. Wenn der Tag unbekannt ist, bitte den 1. Tag des Monats/Jahres eintragen und die Genauigkeit passend setzen.',
    ),
    scheduleDateField(
      'endDate',
      'Bis',
      'Enddatum ist optional. Wenn der Tag unbekannt ist, bitte den 1. Tag des Monats/Jahres eintragen und die Genauigkeit passend setzen.',
    ),
    defineField({name: 'title', title: 'Titel', type: 'string'}),
    defineField({name: 'link', type: 'link'}),
    defineField({name: 'keyword', title: 'Keyword', type: 'string'}),
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
      date?: string | {value?: string; precision?: string}
      endDate?: string | {value?: string; precision?: string}
      keyword?: string
      title?: string
    }) => {
      const startDate = typeof date === 'string' ? date : date?.value
      const finishDate = typeof endDate === 'string' ? endDate : endDate?.value

      return {
        title: title || keyword || 'Fahrplan Eintrag',
        subtitle: [[startDate, finishDate].filter(Boolean).join(' - '), keyword].filter(Boolean).join(' · '),
      }
    },
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
      name: 'marqueeText',
      title: 'Text für das durchlaufende Band',
      type: 'string',
    }),
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
