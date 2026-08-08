import {defineField, defineType} from 'sanity'

const teamMember = {
  type: 'object',
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'role', type: 'string'}),
    defineField({name: 'portrait', type: 'mediaAsset'}),
  ],
  preview: {
    select: {
      name: 'name',
      portrait: 'portrait.0.image',
    },
    prepare: ({name, portrait}: {name?: string; portrait?: unknown}) => ({
      title: name || 'Team Mitglied',
      media: portrait,
    }),
  },
}

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Seite',
  type: 'document',

  fields: [
    defineField({
      name: 'lead',
      title: 'Lead Text',
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
    defineField({
      name: 'artBoard',
      title: 'Art Board',
      type: 'object',
      fields: [
        defineField({name: 'text', type: 'portableText'}),
        defineField({name: 'medium', type: 'mediaAsset'}),
      ],
    }),

    defineField({
      name: 'team',
      title: 'Team',
      type: 'array',
      of: [teamMember],
    }),
  ],
  preview: {
    prepare: () => ({title: 'About Page'}),
  },
})
