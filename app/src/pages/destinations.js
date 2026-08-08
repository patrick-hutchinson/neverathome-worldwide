import { getDestinations, getDestinationsPage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

import Text from "@/components/Text/Text";
import styles from "@/styles/Destinations.module.scss";
import Media from "@/components/Media/Media";
import { LargeSection } from "@/components/Sections/Sections";

const DestinationsPage = ({ destinationsPage, selectedDestination }) => {
  const institutionMedium = selectedDestination?.institutionMedium?.medium;
  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection className={styles.destinationContainer}>
          <div className={styles.destinationsGrid}>
            {selectedDestination ? (
              <>
                <div className={styles.destinationInstitution} typo="h4">
                  <div className={styles.institutionTitle}>{selectedDestination.institution}</div>
                  <div
                    className={[styles.destinationInfo, !institutionMedium ? styles.destinationInfoNoImage : ""]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {institutionMedium ? <Media medium={institutionMedium} className={styles.destinationThumbnail} /> : null}
                    <div className={styles.asideText} typo="h6 compensate">
                      Hier kommt wohl noch ein kleinerer Text hin, ich bin mir aber unsicher worauf genau er sich beziehen
                      soll. Das könnten wir dann nochmal absprechen wenn wir soweit sind.
                    </div>
                    <div typo="h1 compensate" className={styles.abbreviation}>
                      {selectedDestination.abbreviation}
                    </div>
                  </div>
                </div>
                <div className={styles.destinationsText}>
                  <Text className={styles.destinationDescription} text={selectedDestination.description} typo="h5" />
                  <div className={styles.trailText} typo="h6 compensate">
                    Hier kommt wohl noch ein kleinerer Text hin, ich bin mir aber unsicher worauf genau er sich beziehen
                    soll. Das könnten wir dann nochmal absprechen wenn wir soweit sind.
                  </div>
                </div>
              </>
            ) : (
              <Text className={styles.destinationsText} text={destinationsPage.text} typo="h5" />
            )}
          </div>
        </LargeSection>
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
