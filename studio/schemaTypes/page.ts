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
  ],
  preview: {
    prepare: () => ({title: 'Page'}),
  },
})
