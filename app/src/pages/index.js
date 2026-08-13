import { useEffect, useState } from "react";

import styles from "@/styles/Home.module.scss";
import { getDestinations, getHomePage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

import { LargeSection } from "@/components/Sections/Sections";

import { formatCountdown } from "@/lib/countdown";
import { getCurrentPhaseLabel } from "@/lib/phase";

import Text from "@/components/Text/Text";
import FormatDate from "@/components/FormatDate/FormatDate";

export default function Home({ homePage = {} }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection>
          <Text text={homePage.aboutText} typo="h3 compensate" />
        </LargeSection>

        <LargeSection>
          <div id="home-schedule">
            {Object.entries(homePage.schedule || {}).map(([phase, entries]) => (
              <ul key={phase} className={styles.schedule}>
                <h4>{getCurrentPhaseLabel(phase)}</h4>

                {entries?.map((entry) => (
                  <li key={entry._key} className={styles.scheduleEntry}>
                    <div className={styles.scheduleKeyword} typo="h3 compensate">
                      {entry.keyword}
                    </div>

                    <div className={styles.scheduleTitle} typo="h3 compensate">
                      <FormatDate date={entry.date} />
                      {entry.endDate ? (
                        <>
                          {" til "}
                          <FormatDate date={entry.endDate} />
                        </>
                      ) : null}
                      {entry.title ? <span className={styles.title}>: {entry.title}</span> : null}
                    </div>

                    <div className={styles.scheduleCountdown} typo="h3 compensate">
                      {now ? formatCountdown(entry.endDate || entry.date, now) : null}
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
                <div className={styles.quoteContainer} key={quote._key}>
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
