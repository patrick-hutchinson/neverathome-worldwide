import { getPage, getAboutPage, getSite } from "@/lib/sanity";

import Text from "@/components/Text/Text";
import styles from "@/styles/About.module.scss";

import { LargeSection, MediumSection } from "@/components/Sections/Sections";
import Media from "@/components/Media/Media";

const AboutPage = ({ aboutPage }) => {
  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <MediumSection>
          <Text text={aboutPage.lead} typo="h3 compensate" />
        </MediumSection>
        <LargeSection>
          <div className={styles.aboutContainer}>
            <Text className={styles.aboutNeverAtHome} text={aboutPage.aboutNeverAtHome} typo="h5 compensate" />
            <Text
              className={styles.aboutAustriaKulturInternational}
              text={aboutPage.aboutAustriaKulturInternational}
              typo="h5 compensate"
            />
          </div>
        </LargeSection>
        <LargeSection>
          <div className={styles.artBoard}>
            <h3 typo="h3 compesnate" className={styles.title}>
              Art Board
            </h3>
            <Text text={aboutPage.artBoard.text} typo="h6 compensate" className={styles.text} />
            <Media medium={aboutPage.artBoard.medium.medium} className={styles.medium} />
          </div>
          <div className={styles.team}>
            <h3 typo="h3 compesnate" className={styles.title}>
              The Team
            </h3>
            <Text text={aboutPage.artBoard.text} typo="h6 compensate" className={styles.text} />
            <div className={styles.teamPhotos}>
              {aboutPage.team.map((teamMember, index) => {
                return (
                  <div className={styles.teamMember}>
                    <Media medium={teamMember.portrait.medium} className={styles.portrait} />
                    <div typo="h6">
                      {teamMember.name}
                      {",\u00a0"}
                      {teamMember.role}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.contact}>
              Any questions? <a href="mailto:opencall@never-at-home.at">opencall@never-at-home.at</a>
            </div>
          </div>
        </LargeSection>
      </main>
    </div>
  );
};

export default AboutPage;

export async function getStaticProps() {
  const [site, page, aboutPage] = await Promise.all([getSite(), getPage(), getAboutPage()]);

  return {
    props: {
      site,
      page,
      aboutPage,
    },
    revalidate: 60,
  };
}
