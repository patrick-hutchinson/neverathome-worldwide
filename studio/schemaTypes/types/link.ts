import {defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'
import {pageReferenceTypes} from '../pages'

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  options: {columns: 2},
  fields: [
    {
      name: 'type',
      type: 'string',
      options: {
        list: [
          {title: 'Internal', value: 'internal', icon: LinkIcon},
          {title: 'External', value: 'external', icon: LinkIcon},
          {title: 'Email', value: 'email', icon: LinkIcon},
        ],
      },
    },
    {
      name: 'internalLink',
      type: 'reference',
      to: [...pageReferenceTypes],
      hidden: ({parent}) => parent?.type !== 'internal',
    },
    {
      name: 'url',
      type: 'url',
      hidden: ({parent}) => parent?.type !== 'external',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      hidden: ({parent}) => parent?.type !== 'email',
      validation: (Rule) => Rule.email(),
    },
  ],
})
