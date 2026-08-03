import styles from "@/styles/Home.module.css";
import { getDestinations, getPage, getPageDeadlines, getSite } from "@/lib/sanity";

export default function Home() {
  return (
    <div className={`page ${styles.page}`}>
      <main className="main" />
    </div>
  );
}

export async function getStaticProps() {
  const [site, page, pageDeadlines, destinations] = await Promise.all([
    getSite(),
    getPage(),
    getPageDeadlines(),
    getDestinations(),
  ]);

  return {
    props: {
      site,
      page,
      pageDeadlines,
      destinations,
      currentPhase: page.phase || null,
    },
    revalidate: 60,
  };
}
