import {defineField, defineType} from 'sanity'

export const juryMember = defineType({
  name: 'juryMember',
  title: 'Jury Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'portrait', type: 'mediaAsset'}),
    defineField({name: 'bio', type: 'portableText'}),
    defineField({
      name: 'socials',
      title: 'Socials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'platform', title: 'Platform', type: 'string'},
            {name: 'link', title: 'url', type: 'string'},
          ],
        },
      ],
    }),
  ],
})
