import { getDestinations, getDestinationsPage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

import Text from "@/components/Text/Text";
import styles from "@/styles/Home.module.css";

const DestinationsPage = ({ destinationsPage, selectedDestination }) => {
  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <div className={styles.destinationsGrid}>
          {selectedDestination ? (
            <>
              <div className={styles.destinationInstitution} typo="h4">
                {selectedDestination.institution}
              </div>
              <Text className={styles.destinationsText} text={selectedDestination.description} typo="h5" />
            </>
          ) : (
            <Text className={styles.destinationsText} text={destinationsPage.text} typo="h5" />
          )}
        </div>
      </main>
    </div>
  );
};

export default DestinationsPage;

export async function getStaticProps() {
  const [site, page, pageDeadlines, destinationsPage, destinations] = await Promise.all([
    getSite(),
    getPage(),
    getPageDeadlines(),
    getDestinationsPage(),
    getDestinations(),
  ]);

  return {
    props: {
      site,
      page,
      pageDeadlines,
      destinationsPage,
      destinations,
      currentPhase: page.phase || null,
    },
    revalidate: 60,
  };
}
