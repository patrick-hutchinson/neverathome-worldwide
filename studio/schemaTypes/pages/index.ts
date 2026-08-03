import type {SchemaTypeDefinition} from 'sanity'

const pageModules = import.meta.glob('./*Page.ts', {eager: true})

export const pages = Object.values(pageModules)
  .flatMap((module) => Object.values(module as Record<string, unknown>))
  .filter((schema): schema is SchemaTypeDefinition => {
    return Boolean(
      schema &&
        typeof schema === 'object' &&
        'type' in schema &&
        (schema as {type?: unknown}).type === 'document' &&
        'name' in schema &&
        typeof (schema as {name?: unknown}).name === 'string'
    )
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export const pageReferenceTypes = pages.map((page) => ({type: page.name}))
