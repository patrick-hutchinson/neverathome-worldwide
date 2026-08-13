import Imprint from "@/components/Imprint/Imprint";
import { getDestinations, getImprint, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

const ImprintPage = ({ imprint }) => {
  return <Imprint imprint={imprint} isStandalone />;
};

export default ImprintPage;

export async function getStaticProps() {
  const [site, page, pageDeadlines, destinations, imprint] = await Promise.all([
    getSite(),
    getPage(),
    getPageDeadlines(),
    getDestinations(),
    getImprint(),
  ]);

  return {
    props: {
      site,
      page,
      pageDeadlines,
      destinations,
      imprint,
    },
    revalidate: 60,
  };
}
