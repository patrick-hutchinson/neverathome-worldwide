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

export const openCall = defineType({
  name: 'openCallPage',
  title: 'Open Call Seite',
  type: 'document',

  fields: [
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
    prepare: () => ({title: 'Open Call Seite'}),
  },
})
