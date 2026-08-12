import Media from "@/components/Media/Media";
import { getJuryMembers, getJuryPage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";
import styles from "@/styles/Jury.module.scss";

import Text from "@/components/Text/Text";
import { LargeSection } from "@/components/Sections/Sections";

const JuryPage = ({ juryMembers, juryPage }) => {
  if (!juryMembers || juryMembers.length === 0) return;

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <LargeSection>
          <div className={styles.juryGrid}>
            {juryMembers.map((juryMember) => {
              return (
                <div className={styles.juryMemberContainer} key={juryMember._id} typo="h3">
                  <hr className={styles.divider} />
                  <div className={styles.juryMemberContainerInner} typo="h3 compensate">
                    <div className={styles.juryMemberName} typo="h3">
                      {juryMember.name}
                    </div>
                    {juryMember?.portrait?.medium ? (
                      <Media className={styles.juryMemberMedia} medium={juryMember.portrait.medium} />
                    ) : null}
                    <Text className={styles.juryMemberBio} text={juryMember.bio} typo="h6" />
                  </div>
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
