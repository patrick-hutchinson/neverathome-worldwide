import {defineField, defineType} from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'aboutLead',
      title: 'About (Lead Text)',
      type: 'portableText',
    }),
    defineField({
      name: 'aboutNeverAtHome',
      title: 'About (NeverAtHome Text)',
      type: 'portableText',
    }),
    defineField({
      name: 'aboutAustriaKulturInternational',
      title: 'About (Austria Kultur International)',
      type: 'portableText',
    }),
  ],
  preview: {
    prepare: () => ({title: 'About Page'}),
  },
})
