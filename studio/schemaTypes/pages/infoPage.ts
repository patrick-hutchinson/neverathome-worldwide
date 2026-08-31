import {defineField, defineType} from 'sanity'

const faqEntry = {
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Frage',
      type: 'string',
    }),
    defineField({
      name: 'answer',
      title: 'Antwort',
      type: 'portableText',
    }),
  ],
  preview: {
    select: {
      question: 'question',
    },
    prepare: ({question}: {question?: string}) => ({
      title: question || 'FAQ Eintrag',
    }),
  },
}

const faqSection = {
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
    }),
    defineField({
      name: 'entries',
      title: 'Fragen und Antworten',
      type: 'array',
      of: [faqEntry],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      entries: 'entries',
    },
    prepare: ({title, entries}: {title?: string; entries?: unknown[]}) => ({
      title: title || 'FAQ Abschnitt',
      subtitle: entries?.length ? `${entries.length} Einträge` : undefined,
    }),
  },
}

export const infoPage = defineType({
  name: 'infoPage',
  title: 'Info Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'marqueeText',
      title: 'Text für das durchlaufende Band',
      type: 'string',
    }),
    defineField({name: 'info', type: 'portableText'}),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [faqSection],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Info Seite'}),
  },
})
