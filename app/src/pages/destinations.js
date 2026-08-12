import { getDestinations, getDestinationsPage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

import Text from "@/components/Text/Text";
import styles from "@/styles/Destinations.module.scss";
import Media from "@/components/Media/Media";
import { LargeSection } from "@/components/Sections/Sections";
import RenderSVG from "@/components/RenderSVG/RenderSVG";

const abbreviationUndershootPattern = /[JOUSC]/i;

const DestinationsPage = ({ destinationsPage, selectedDestination }) => {
  const institutionMedium = selectedDestination?.institutionMedium?.medium;
  const abbreviation = selectedDestination?.abbreviation || "";
  const hasAbbreviationUndershoot = abbreviationUndershootPattern.test(abbreviation);

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection className={styles.destinationContainer}>
          <div className={styles.destinationGrid}>
            {selectedDestination ? (
              <>
                <div className={styles.institutionContainer} typo="h4">
                  <div className={styles.institutionName} typo="h4 compensate">
                    {selectedDestination.institution}
                  </div>
                  <div
                    className={[styles.institutionInfo, !institutionMedium ? styles.institutionInfoNoImage : ""]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {institutionMedium ? <Media medium={institutionMedium} className={styles.institutionMedium} /> : null}

                    <div typo="h1" className={styles.cityAbbreviation}>
                      <RenderSVG
                        className={[
                          styles.cityAbbreviationSvg,
                          hasAbbreviationUndershoot ? styles.cityAbbreviationSvgUndershoot : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        letterSpacing={-40}
                        text={abbreviation}
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.destinationText}>
                  <Text className={styles.destinationDescription} text={selectedDestination.description} typo="h5" />
                  <div className={styles.trailText} typo="h6 compensate">
                    <Text text={selectedDestination.info} />
                  </div>
                </div>
              </>
            ) : (
              <Text className={styles.destinationText} text={destinationsPage.text} typo="h5" />
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
