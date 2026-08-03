import { getDestinations, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

export default async function handler(req, res) {
  const [site, page, pageDeadlines, destinations] = await Promise.all([
    getSite(),
    getPage(),
    getPageDeadlines(),
    getDestinations(),
  ]);

  res.status(200).json({
    site,
    page,
    pageDeadlines,
    destinations,
    currentPhase: page.phase || null,
  });
}
