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
    defineField({name: 'deadline', type: 'datetime'}),
    defineField({name: 'info', type: 'portableText'}),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [faqEntry],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Info Seite'}),
  },
})
