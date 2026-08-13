import { getDestinations, getOpenCallPage, getPage, getSite } from "@/lib/sanity";
import styles from "@/styles/OpenCall.module.scss";

import Text from "@/components/Text/Text";
import { LargeSection } from "@/components/Sections/Sections";
import Accordion from "@/components/Accordion/Accordion";

const OpenCallPage = ({ destinations = [], openCallPage, page }) => {
  if (!openCallPage || openCallPage.length === 0) return null;
  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection>
          <Text text={openCallPage.info} typo="h3 compensate" />
        </LargeSection>

        <LargeSection>
          <Accordion array={openCallPage.faq} />
        </LargeSection>
      </main>
    </div>
  );
};

export default OpenCallPage;

export async function getStaticProps() {
  const [site, page, openCallPage, destinations] = await Promise.all([
    getSite(),
    getPage(),
    getOpenCallPage(),
    getDestinations(),
  ]);

  return {
    props: {
      site,
      page,
      openCallPage,
      destinations,
    },
    revalidate: 60,
  };
}
