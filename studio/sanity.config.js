import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {structure} from './structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  name: 'default',
  title: 'neverathome-worldwide-studio',

  projectId: 'aw4em3wa',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool(), muxInput()],

  schema: {
    types: schemaTypes,
  },
})
