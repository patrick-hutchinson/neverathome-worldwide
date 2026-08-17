import type {StructureResolver} from 'sanity/structure'
import {DashboardIcon} from '@sanity/icons/Dashboard'
import {pages} from './schemaTypes/pages'

// Define singleton document IDs here
const singletonTypes = ['site', 'page', ...pages.map((page) => page.name)]
const definitions = ['category', 'videoAsset']

// Add other types you want to hide from Desk here
const hiddenTypes = [...singletonTypes, ...definitions]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Top-level singleton
      S.listItem()
        .id('site')
        .title('Site')
        .icon(DashboardIcon)
        .child(S.document().schemaType('site').documentId('site')),

      S.listItem()
        .id('pages')
        .title('Seiten')
        .icon(DashboardIcon)
        .child(
          S.list()
            .title('Seiten')
            .items([
              S.listItem()
                .id('page')
                .title('Seitenübergreifender Content')
                .icon(DashboardIcon)
                .child(S.document().schemaType('page').documentId('page')),

              ...pages.map((page) =>
                S.listItem()
                  .id(page.name)
                  .title(page.title || page.name)
                  .child(S.document().schemaType(page.name).documentId(page.name)),
              ),
            ]),
        ),

      S.divider(),

      // Everything else (exclude hidden types and the ones we added above)
      ...S.documentTypeListItems().filter((listItem) => !hiddenTypes.includes(listItem.getId()!)),
    ])
