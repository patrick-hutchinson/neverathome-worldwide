import { getDestinations, getInfoPage, getPage, getSite } from "@/lib/sanity";
import styles from "@/styles/InfoPage.module.scss";

import Text from "@/components/Text/Text";
import { LargeSection } from "@/components/Sections/Sections";
import Accordion from "@/components/Accordion/Accordion";

const InfoPage = ({ destinations = [], infoPage, page }) => {
  if (!infoPage || infoPage.length === 0) return null;
  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection>
          <Text text={infoPage.info} typo="h3 compensate" />
        </LargeSection>

        <LargeSection>
          <Accordion array={infoPage.faq} />
        </LargeSection>
      </main>
    </div>
  );
};

export default InfoPage;

export async function getStaticProps() {
  const [site, page, infoPage, destinations] = await Promise.all([getSite(), getPage(), getInfoPage(), getDestinations()]);

  return {
    props: {
      site,
      page,
      infoPage,
      destinations,
    },
    revalidate: 60,
  };
}
