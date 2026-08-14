import {defineType} from 'sanity'

export const mediaAsset = defineType({
  name: 'mediaAsset',
  title: 'Image',
  type: 'array',
  of: [{type: 'imageAsset'}],
  validation: (rule) => rule.max(1),
})
