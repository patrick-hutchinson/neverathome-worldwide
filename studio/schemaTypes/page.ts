import {defineField, defineType} from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',

  fields: [
    defineField({
      name: 'phase',
      type: 'string',
      options: {
        list: [
          {title: 'Phase A', value: 'phaseA'},
          {title: 'Phase B', value: 'phaseB'},
          {title: 'Phase C', value: 'phaseC'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'marqueeText', title: "Text für's kleine Banderl", type: 'string'}),
    defineField({name: 'claim', title: 'Claim (im Footer)', type: 'portableText'}),
    defineField({name: 'informationPDF', title: 'Info PDF', type: 'file'}),
    defineField({name: 'formLink', title: 'Link zur Anmeldungs-Form', type: 'string'}),
    defineField({
      name: 'mediaPartner',
      title: 'Media Partner (Footer Logos)',
      type: 'array',
      of: [{type: 'file'}],
    }),
    defineField({name: 'globeTexture', title: 'Weltkugel Textur (jpg!)', type: 'image'}),
  ],
  preview: {
    prepare: () => ({title: 'Page'}),
  },
})
