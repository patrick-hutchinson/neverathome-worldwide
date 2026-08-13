import Link from "next/link";
import { motion } from "framer-motion";

import { CountdownText } from "@/components/Countdown/Countdown";
import styles from "./Menu.module.css";

const Menu = ({ currentPhaseLabel = null, navLinks = [], email = null }) => {
  const openCallLink = navLinks.find((link) => link.href === "/open-call");
  const juryLink = navLinks.find((link) => link.href === "/jury");
  const destinationsLink = navLinks.find((link) => link.href === "/destinations");

  return (
    <motion.div
      className={styles.menu}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: "easeInOut" }}
    >
      <nav className={styles.nav} typo="h2 compensate">
        <div className={styles.topSection}>
          {currentPhaseLabel ? <Link href="/">{currentPhaseLabel}</Link> : null}
          <CountdownText className={styles.countdown} deadline={openCallLink?.deadline} hideSeconds />
        </div>

        <div className={styles.bottomSection}>
          {openCallLink ? <Link href={openCallLink.href}>{openCallLink.label}</Link> : null}
          {juryLink ? <Link href={juryLink.href}>{juryLink.label}</Link> : null}
          {destinationsLink ? <Link href={destinationsLink.href}>{destinationsLink.label}</Link> : null}
          <br />

          <Link href="/about">About</Link>
          {email ? <a href={`mailto:${email}`}>Contact</a> : <span>Contact</span>}

          <br />
          {email ? <a href="#">Apply</a> : <span>Contact</span>}
        </div>
      </nav>
    </motion.div>
  );
};

export default Menu;
