import Link from "next/link";
import { motion } from "framer-motion";

import styles from "./Menu.module.css";

const formatMenuCountdown = (countdown) => countdown?.replace(/\s*\d+s$/, "");

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
          {openCallLink.countdown ? (
            <span className={styles.countdown}>{formatMenuCountdown(openCallLink.countdown)}</span>
          ) : null}
        </div>

        <div className={styles.bottomSection}>
          <Link href={openCallLink.href}>{openCallLink.label}</Link>
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
