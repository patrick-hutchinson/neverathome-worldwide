import {defineField, defineType} from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'aboutText',
      title: 'About (Text)',
      type: 'portableText',
    }),
  ],
  preview: {
    prepare: () => ({title: 'About Page'}),
  },
})
