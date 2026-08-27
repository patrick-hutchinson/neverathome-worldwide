import { getDestinations, getInfoPage, getPage, getSite } from "@/lib/sanity";
import styles from "@/styles/InfoPage.module.scss";

import Text from "@/components/Text/Text";
import { LargeSection } from "@/components/Sections/Sections";
import Accordion from "@/components/Accordion/Accordion";

const InfoPage = ({ destinations = [], infoPage, page }) => {
  if (!infoPage || infoPage.length === 0) return null;

  const faq = infoPage.faq || [];
  const faqSections = faq.some((section) => Array.isArray(section.entries))
    ? faq
    : [
        {
          _key: "faq",
          title: "FAQ",
          entries: faq,
        },
      ];

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection>
          <Text text={infoPage.info} typo="h3 compensate" />
        </LargeSection>

        <LargeSection>
          <div className={styles.faqSections}>
            {faqSections.map((section, index) => (
              <section className={styles.faqSection} key={section._key || section.title || index}>
                <h4>{section.title}</h4>
                <Accordion array={section.entries} />
              </section>
            ))}
          </div>
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
