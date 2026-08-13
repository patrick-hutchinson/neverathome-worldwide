import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { CountdownSlot, CountdownText } from "@/components/Countdown/Countdown";
import { getCurrentPhaseLabel } from "@/lib/phase";
import styles from "./Header.module.scss";
import { DeviceContext } from "@/context/DeviceContext";

import Menu from "@/components/Menu/Menu";

const links = [
  { href: "/open-call", label: "Open Call", deadlineKey: "openCallPage" },
  { href: "/jury", label: "Jury", deadlineKey: "juryPage" },
  { href: "/destinations", label: "Destinations", deadlineKey: "destinationsPage" },
];

const progressStartDate = new Date("2026-08-03T00:00:00");
const progressEndDate = new Date("2026-12-31T23:59:59");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getProgress(now) {
  if (!now) return 0;

  const total = progressEndDate - progressStartDate;
  if (total <= 0) return 100;

  return clamp(((now - progressStartDate) / total) * 100, 0, 100);
}

const Header = ({ currentPhase = null, pageDeadlines = {}, site = {} }) => {
  const { isMobile } = useContext(DeviceContext);
  const router = useRouter();
  const [progressNow, setProgressNow] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentPhaseLabel = getCurrentPhaseLabel(currentPhase);
  const navLinks = useMemo(
    () =>
      links.map((link) => ({
        ...link,
        deadline: pageDeadlines[link.deadlineKey],
      })),
    [pageDeadlines],
  );

  useEffect(() => {
    setProgressNow(new Date());
  }, []);

  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);

    router.events.on("routeChangeComplete", closeMenu);
    router.events.on("routeChangeError", closeMenu);

    return () => {
      router.events.off("routeChangeComplete", closeMenu);
      router.events.off("routeChangeError", closeMenu);
    };
  }, [router.events]);

  const Progressbar = () => {
    const progress = getProgress(progressNow);

    return (
      <div className={styles.progressbar}>
        <div className={styles.progressbarFill} style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
    );
  };

  const getLinkClassName = (href) =>
    [styles.link, router.pathname === href ? styles.linkActive : ""].filter(Boolean).join(" ");

  const preventSameRouteNavigation = (href) => (event) => {
    if (router.pathname !== href) return;

    event.preventDefault();
  };

  const handleHomeLinkClick = (event) => {
    if (router.pathname !== "/") return;

    event.preventDefault();
    document.getElementById("home-schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const DesktopNav = () => {
    const openCallLink = navLinks.find((link) => link.href === "/open-call");

    return (
      <nav className={styles.nav} typo="h4 compensate">
        <div className={styles.phases}>
          {currentPhaseLabel ? (
            <span className={[styles.navItem, styles.phaseItem].filter(Boolean).join(" ")} data-random-hover-color>
              <Link
                className={[getLinkClassName("/"), styles.phaseLink].filter(Boolean).join(" ")}
                href="/"
                onClick={handleHomeLinkClick}
              >
                {currentPhaseLabel}
              </Link>
              <CountdownSlot
                className={styles.countdown}
                deadline={openCallLink?.deadline}
                ghostClassName={styles.countdownGhost}
                slotClassName={styles.countdownSlot}
              />
            </span>
          ) : null}
          {navLinks.map((link) => (
            <span
              className={[styles.navItem, link.href === "/open-call" ? styles.navItemOpenCall : ""]
                .filter(Boolean)
                .join(" ")}
              data-random-hover-color
              key={link.href}
            >
              <Link className={getLinkClassName(link.href)} href={link.href} onClick={preventSameRouteNavigation(link.href)}>
                {link.label}
              </Link>
              {link.href !== "/open-call" ? (
                <CountdownText className={styles.countdown} deadline={link.deadline} />
              ) : null}
            </span>
          ))}
        </div>
        <div>
          <Link className={getLinkClassName("/about")} href="/about" onClick={preventSameRouteNavigation("/about")}>
            About
          </Link>
          {",\u00a0"}
          {site.email ? (
            <a className={styles.link} href={`mailto:${site.email}`}>
              Email
            </a>
          ) : null}
        </div>
      </nav>
    );
  };

  const MobileNav = () => {
    const openCallLink = navLinks.find((link) => link.href === "/open-call");

    if (!openCallLink) return null;

    return (
      <nav className={styles.nav} typo="h4 compensate">
        <span className={styles.navItem} data-random-hover-color>
          <Link
            className={getLinkClassName(openCallLink.href)}
            href={openCallLink.href}
            onClick={preventSameRouteNavigation(openCallLink.href)}
          >
            {openCallLink.label}
          </Link>
          <CountdownText className={styles.countdown} deadline={openCallLink.deadline} />
        </span>
        <button
          className={[styles.menuButton, isMenuOpen ? styles.menuButtonOpen : ""].filter(Boolean).join(" ")}
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <span />
          <span />
        </button>
      </nav>
    );
  };

  return (
    <header className={styles.header}>
      <Progressbar />
      {isMobile ? <MobileNav /> : <DesktopNav />}
      <AnimatePresence>
        {isMobile && isMenuOpen ? (
          <Menu currentPhaseLabel={currentPhaseLabel} navLinks={navLinks} email={site.email} />
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Header;
