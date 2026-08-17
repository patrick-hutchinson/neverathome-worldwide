import { getPreviewClient, getProductionClient } from "./client";
import {
  destinationsPageQuery,
  destinationsQuery,
  homePageQuery,
  imprintQuery,
  juryMembersQuery,
  juryPageQuery,
  pageDeadlinesQuery,
  infoPageQuery,
  pageQuery,
  aboutPageQuery,
  siteQuery,
} from "./queries";

export const fallbackSiteData = {
  title: "Patrick Hutchinson",
  description: "",
  faviconUrl: "/favicon.ico",
  shareImageUrl: null,
};

export function getSanityClient() {
  const isProduction = process.env.VERCEL_ENV === "production";
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isLocal = !process.env.VERCEL_ENV;
  const hasReadToken = Boolean(process.env.SANITY_READ_TOKEN);

  if ((isPreview || isLocal) && hasReadToken) {
    return getPreviewClient();
  }

  if (isProduction || !hasReadToken) {
    return getProductionClient();
  }

  return getProductionClient();
}

function normalizeSite(site) {
  return {
    ...fallbackSiteData,
    ...site,
    faviconUrl: site?.favicon?.asset?.url || fallbackSiteData.faviconUrl,
    shareImageUrl: site?.shareImage?.asset?.url || fallbackSiteData.shareImageUrl,
  };
}

export async function getSite() {
  const site = await getSanityClient().fetch(siteQuery);

  return normalizeSite(site);
}

export async function getPageDeadlines() {
  const deadlines = await getSanityClient().fetch(pageDeadlinesQuery);

  return deadlines || {};
}

export async function getPage() {
  const page = await getSanityClient().fetch(pageQuery);

  return page || {};
}

export async function getAboutPage() {
  const aboutPage = await getSanityClient().fetch(aboutPageQuery);

  return aboutPage || {};
}

export async function getHomePage() {
  const homePage = await getSanityClient().fetch(homePageQuery);

  return homePage || {};
}

export async function getInfoPage() {
  const infoPage = await getSanityClient().fetch(infoPageQuery);

  return infoPage || {};
}

export async function getDestinationsPage() {
  const destinationsPage = await getSanityClient().fetch(destinationsPageQuery);

  return destinationsPage || {};
}

export async function getJuryPage() {
  const juryPage = await getSanityClient().fetch(juryPageQuery);

  return juryPage || {};
}

export async function getImprint() {
  const imprint = await getSanityClient().fetch(imprintQuery);

  return imprint || {};
}

export async function getJuryMembers() {
  const juryMembers = await getSanityClient().fetch(juryMembersQuery);

  return juryMembers || [];
}

export async function getDestinations() {
  const destinations = await getSanityClient().fetch(destinationsQuery);

  return destinations || [];
}
