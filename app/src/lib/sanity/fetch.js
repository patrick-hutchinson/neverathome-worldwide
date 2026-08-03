import { getPreviewClient, getProductionClient } from "./client";
import { destinationsQuery, pageDeadlinesQuery, pageQuery, siteQuery } from "./queries";

export const fallbackSiteData = {
  title: "Patrick Hutchinson",
  description: "",
  faviconUrl: "/favicon.ico",
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

export async function getDestinations() {
  const destinations = await getSanityClient().fetch(destinationsQuery);

  return destinations || [];
}
