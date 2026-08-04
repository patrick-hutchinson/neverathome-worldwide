import {site} from './site'
import {page} from './page'
import {pages} from './pages'
import {category} from './types/category'
import {link} from './types/link'
import {portableText} from './types/portableText'
import {destination} from './destination'
import {juryMember} from './juryMember'
import {mediaAsset} from './types/media/mediaAsset'
import {imageAsset} from './types/media/imageAsset'
import {videoAsset} from './types/media/videoAsset'

export const schemaTypes = [
  site,
  page,
  destination,
  ...pages,
  category,
  link,
  portableText,
  juryMember,
  mediaAsset,
  imageAsset,
  videoAsset,
]
