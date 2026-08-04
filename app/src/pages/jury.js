import Media from "@/components/Media/Media";
import { getJuryMembers, getJuryPage, getPage, getPageDeadlines, getSite } from "@/lib/sanity";
import styles from "@/styles/Home.module.css";

import Text from "@/components/Text/Text";

const JuryPage = ({ juryMembers, juryPage }) => {
  if (!juryMembers || juryMembers.length === 0) return;

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <div className={styles.juryGrid}>
          {juryMembers.map((juryMember, index) => {
            return (
              <div className={styles.juryMemberContainer}>
                {juryMember?.portrait?.medium ? <Media medium={juryMember.portrait.medium} /> : null}
                <Text text={juryMember.bio} />
              </div>
            );
          })}
        </div>
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
