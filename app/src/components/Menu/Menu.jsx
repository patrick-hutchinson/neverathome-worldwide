import Link from "next/link";
import { motion } from "framer-motion";

import { CountdownText } from "@/components/Countdown/Countdown";
import styles from "./Menu.module.css";

const Menu = ({
  currentPhaseLabel = null,
  email = null,
  isProductionLocked = false,
  navLinks = [],
  onApplyClick = null,
  onContactClick = null,
  onSpacingDebugToggle = null,
}) => {
  const infoLink = navLinks.find((link) => link.href === "/info");
  const juryLink = navLinks.find((link) => link.href === "/jury");
  const destinationsLink = navLinks.find((link) => link.href === "/destinations");
  const disabledProps = isProductionLocked ? { "aria-disabled": true, onClick: (event) => event.preventDefault() } : {};

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
          {currentPhaseLabel ? <Link href="/" {...disabledProps}>{currentPhaseLabel}</Link> : null}
          {/* <CountdownText className={styles.countdown} deadline={infoLink?.deadline} hideSeconds /> */}
        </div>

        <div className={styles.bottomSection}>
          {infoLink ? <Link className={isProductionLocked ? styles.disabledLink : ""} href={infoLink.href} {...disabledProps}>{infoLink.label}</Link> : null}
          {juryLink ? <Link className={isProductionLocked ? styles.disabledLink : ""} href={juryLink.href} {...disabledProps}>{juryLink.label}</Link> : null}
          {destinationsLink ? <Link className={isProductionLocked ? styles.disabledLink : ""} href={destinationsLink.href} {...disabledProps}>{destinationsLink.label}</Link> : null}
          <br />

          <Link className={isProductionLocked ? styles.disabledLink : ""} href="/about" {...disabledProps}>About</Link>
          <a className={isProductionLocked ? styles.disabledLink : ""} data-manual-navigation href="/about" onClick={isProductionLocked ? disabledProps.onClick : onContactClick}>
            Contact
          </a>

          <br />
          {email ? (
            <button
              className={[styles.menuAction, isProductionLocked ? styles.disabledLink : ""].filter(Boolean).join(" ")}
              disabled={isProductionLocked}
              onClick={onApplyClick}
              type="button"
            >
              Apply
            </button>
          ) : (
            <span>Contact</span>
          )}
          <button className={isProductionLocked ? styles.disabledLink : styles.debugButton} type="button" disabled={isProductionLocked} onClick={onSpacingDebugToggle}>
            Spacing Debug
          </button>
        </div>
      </nav>
    </motion.div>
  );
};

export default Menu;
