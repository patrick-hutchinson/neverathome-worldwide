import {defineField, defineType} from 'sanity'

export const destination = defineType({
  name: 'destination',
  title: 'Destinations',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'abbreviation',
      title: 'Kürzel der Stadt',
      type: 'string',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'coordinates',
      type: 'object',
      options: {columns: 2},
      fields: [
        {
          name: 'latitude',
          title: 'Latitude',
          type: 'number',
          validation: (Rule) => Rule.required().min(-90).max(90),
        },
        {
          name: 'longitude',
          title: 'Longitude',
          type: 'number',
          validation: (Rule) => Rule.required().min(-180).max(180),
        },
      ],
    }),
    defineField({name: 'institution', type: 'string'}),
    defineField({name: 'institutionMedium', type: 'mediaAsset'}),
    defineField({name: 'description', type: 'portableText'}),
    defineField({
      name: 'info',
      description:
        'Der kleine Text, der unter dem Haupt-Textblock steht. Darf wahlweise leer gelassenw werden',
      type: 'portableText',
    }),
  ],
})
