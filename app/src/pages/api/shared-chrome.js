import { getDestinations, getImprint, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

export default async function handler(req, res) {
  const [site, page, pageDeadlines, destinations, imprint] = await Promise.all([
    getSite(),
    getPage(),
    getPageDeadlines(),
    getDestinations(),
    getImprint(),
  ]);

  res.status(200).json({
    site,
    page,
    pageDeadlines,
    destinations,
    imprint,
    currentPhase: page.phase || null,
  });
}
