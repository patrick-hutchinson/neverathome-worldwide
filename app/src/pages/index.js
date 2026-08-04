import styles from "@/styles/Home.module.css";
import { getDestinations, getHomePage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

import { LargeSection } from "@/components/Sections/Sections";

import { getCurrentPhaseLabel } from "@/lib/phase";

import Text from "@/components/Text/Text";
import FormatDate from "@/components/FormatDate/FormatDate";

export default function Home({ homePage = {}, currentPhase }) {
  let scheduleIndex = 0;

  const currentPhaseLabel = getCurrentPhaseLabel(currentPhase);

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection>
          <Text text={homePage.aboutText} typo="h3 compensate" />
        </LargeSection>

        <LargeSection>
          <div>
            {Object.entries(homePage.schedule || {}).map(([phase, entries]) => (
              <ul key={phase} className={styles.schedule}>
                <h4>{currentPhaseLabel}</h4>

                {entries?.map((entry) => (
                  <li key={entry._key}>
                    <div className={styles.scheduleTitle} typo="h3 compensate">
                      <FormatDate date={entry.date} />
                      {entry.endDate ? (
                        <>
                          {" til "}
                          <FormatDate date={entry.endDate} />
                        </>
                      ) : null}
                      {entry.title ? <>: {entry.title}</> : null}
                    </div>
                    <div className={styles.scheduleKeyword} typo="h3 compensate">
                      {entry.keyword}
                    </div>
                    <div className={styles.scheduleIndex} typo="h3 compensate">
                      {(scheduleIndex += 1)}
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </LargeSection>

        <LargeSection>
          <div className={styles.quotes}>
            {(homePage.quotes || []).map((quote) => {
              return (
                <div className={styles.quote} key={quote._key}>
                  <Text text={quote.text} className={styles.quoteText} typo="h4 compensate" />
                  <div className={styles.quoteAttribution} typo="h6">
                    {quote.person}, {quote.role}
                  </div>
                </div>
              );
            })}
          </div>
        </LargeSection>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const [site, page, pageDeadlines, destinations, homePage] = await Promise.all([
    getSite(),
    getPage(),
    getPageDeadlines(),
    getDestinations(),
    getHomePage(),
  ]);

  return {
    props: {
      site,
      page,
      pageDeadlines,
      destinations,
      homePage,
      currentPhase: page.phase || null,
    },
    revalidate: 60,
  };
}
