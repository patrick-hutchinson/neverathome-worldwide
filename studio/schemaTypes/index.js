import {site} from './site'
import {page} from './page'
import {pages} from './pages'
import {category} from './types/category'
import {link} from './types/link'
import {portableText} from './types/portableText'
import {destination} from './destination'

export const schemaTypes = [site, page, destination, ...pages, category, link, portableText]
