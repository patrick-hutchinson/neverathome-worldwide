import Media from "@/components/Media/Media";
import { getJuryMembers, getJuryPage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";
import styles from "@/styles/Home.module.css";

import Text from "@/components/Text/Text";
import { LargeSection } from "@/components/Sections/Sections";

const groupInPairs = (items = []) => {
  const groups = [];

  for (let index = 0; index < items.length; index += 2) {
    groups.push(items.slice(index, index + 2));
  }

  return groups;
};

const JuryPage = ({ juryMembers, juryPage }) => {
  if (!juryMembers || juryMembers.length === 0) return;
  const juryMemberPairs = groupInPairs(juryMembers);

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection>
          <div className={styles.juryGrid}>
            {juryMemberPairs.map((juryMemberPair) => {
              return (
                <div className={styles.juryMemberPair} key={juryMemberPair.map((juryMember) => juryMember._id).join("-")}>
                  {juryMemberPair.map((juryMember) => (
                    <div className={styles.juryMemberContainer} key={juryMember._id} typo="h3 compensate">
                      <div className={styles.juryMemberName} typo="h3">
                        {juryMember.name}
                      </div>
                      {juryMember?.portrait?.medium ? (
                        <Media className={styles.juryMemberMedia} medium={juryMember.portrait.medium} />
                      ) : null}
                      <Text className={styles.juryMemberBio} text={juryMember.bio} typo="h5" />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </LargeSection>
      </main>
    </div>
  );
};

export default JuryPage;

export async function getStaticProps() {
  const [site, page, pageDeadlines, juryPage, juryMembers] = await Promise.all([
    getSite(),
    getPage(),
    getPageDeadlines(),
    getJuryPage(),
    getJuryMembers(),
  ]);

  return {
    props: {
      site,
      page,
      pageDeadlines,
      juryPage,
      juryMembers,
      currentPhase: page.phase || null,
    },
    revalidate: 60,
  };
}
