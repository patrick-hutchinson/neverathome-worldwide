import { mediaAssetFragment } from "./fragments";

export const siteQuery = `*[_type=="site"][0]{
  title,
  favicon{
    asset->{
      url
    }
  },
  description,
  address,
  email,
  instagram,
  phone,
  socials[]{
    platform,
    link
  },
}`;

export const pageDeadlinesQuery = `{
  "openCallPage": *[_type=="openCallPage"][0].deadline,
  "juryPage": *[_type=="juryPage"][0].deadline,
  "destinationsPage": *[_type=="destinationsPage"][0].deadline
}`;

export const pageQuery = `*[_type=="page"][0]{
  phase,
  marqueeText,
  claim,
  informationPDF{
    asset->{
      url,
      originalFilename
    }
  },
  formLink,
  mediaPartner[]{
    asset->{
      url,
      mimeType,
      originalFilename
    }
  },
}`;

export const homePageQuery = `*[_type=="homePage"][0]{
  aboutText,
  schedule{
    phaseA[]{
      _key,
      date,
      endDate,
      title,
      keyword
    },
    phaseB[]{
      _key,
      date,
      endDate,
      title,
      keyword
    },
    phaseC[]{
      _key,
      date,
      endDate,
      title,
      keyword
    }
  },
  quotes[]{
    _key,
    text,
    person,
    role
  }
}`;

export const destinationsPageQuery = `*[_type=="destinationsPage"][0]{
  deadline,
  text

}`;
export const openCallPageQuery = `*[_type=="openCallPage"][0]{
  deadline,
  info,
  faq,
}`;

export const juryPageQuery = `*[_type=="juryPage"][0]{
  deadline
}`;

export const aboutPageQuery = `*[_type=="aboutPage"][0]{
  lead,
  aboutNeverAtHome,
  aboutAustriaKulturInternational,
  team[]{
    name,
    role,
    portrait[0] ${mediaAssetFragment},
  },
  artBoard{
    title,
    text,
    medium[0] ${mediaAssetFragment},
  }
}`;

export const juryMembersQuery = `*[_type=="juryMember"] | order(name asc) {
  _id,
  name,
  portrait[0] ${mediaAssetFragment},
  bio,
  socials[]{
    platform,
    link
  }
}`;

export const destinationsQuery = `*[
  _type == "destination" &&
  defined(name) &&
  defined(coordinates.latitude) &&
  defined(coordinates.longitude)
] | order(name asc) {
  _id,
  name,
  "lat": coordinates.latitude,
  "lng": coordinates.longitude,
  institution,
  institutionMedium[0] ${mediaAssetFragment},
  description,
  abbreviation
}`;

export const homeQuery = `*[_type=="home"][0]{
  selection[]->{
    _type == "project" => {
      _id,
      _type,
      title,
      client,
      categories[]->{
        _id,
        name,
      },
      scheduling,
      description,
      credits[]{
        role,
        entries
      },
      thumbnail[0] ${mediaAssetFragment},
      thumbnail_mobile[0] ${mediaAssetFragment},
      coverMedia[0] ${mediaAssetFragment},
      coverMedia_mobile[0] ${mediaAssetFragment},
      gallery[]{
        _key,
        media[] ${mediaAssetFragment}
      },
      slug
    },

    _type == "experience" => {
      _id,
      _type,
      title,
      scheduling,
      thumbnail[0] ${mediaAssetFragment},
      gallery[] ${mediaAssetFragment},
      link,
    },

    _type == "publicity" => {
      _id,
      _type,
      title,
      scheduling,
      thumbnail[0] ${mediaAssetFragment},
      gallery[] ${mediaAssetFragment},
      link,
    }
  }
}`;

export const projectSlugsQuery = `*[_type=="project" && defined(slug.current)]{
  "slug": slug.current
}`;

export const projectNavigationQuery = `*[_type=="home"][0].selection[]->{
  _id,
  _type,
  title,
  thumbnail[0] ${mediaAssetFragment},
  thumbnail_mobile[0] ${mediaAssetFragment},
  coverMedia[0] ${mediaAssetFragment},
  coverMedia_mobile[0] ${mediaAssetFragment},
  pageBuilder[]{
    _key,
    _type,
    _type == "projectFullscreenMedium" => {
      medium[0] ${mediaAssetFragment}
    },
    _type == "projectScaleGallery" => {
      media[] ${mediaAssetFragment}
    }
  },
  slug
}`;

export const projectQuery = `*[_type=="project" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  client,
  categories[]->{
    _id,
    name,
  },
  scheduling,
  description
  credits[]{
    role,
    entries
  },
  thumbnail[0] ${mediaAssetFragment},
  thumbnail_mobile[0] ${mediaAssetFragment},
  coverMedia[0] ${mediaAssetFragment},
  coverMedia_mobile[0] ${mediaAssetFragment},
  pageBuilder[]{
    _key,
    _type,
    _type == "projectFullscreenMedium" => {
      caption,
      subcaption,
      medium[0] ${mediaAssetFragment}
    },
    _type == "projectScaleGallery" => {
      media[] ${mediaAssetFragment}
    }
  },
  gallery[]{
    _key,
    media[] ${mediaAssetFragment}
  },
  link,
  slug
}`;

export const infoQuery = `*[_type=="info"][0]{
  description,
  socials[]{
    platform,
    link
  },
  VATNumber,
  CV{
    asset->{
      _id,
      url,
      originalFilename
    }
  },
  recommendations{
    asset->{
      _id,
      url,
      originalFilename
    }
  },
  Recommendations{
    asset->{
      _id,
      url,
      originalFilename
    }
  }
}`;
