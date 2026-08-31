import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CountdownSlot, CountdownText } from "@/components/Countdown/Countdown";
import { getCurrentPhaseLabel } from "@/lib/phase";
import styles from "./Header.module.scss";
import { DeviceContext } from "@/context/DeviceContext";

import Menu from "@/components/Menu/Menu";

const links = [
  { href: "/info", label: "Info", deadlineKey: "infoPage" },
  { href: "/jury", label: "Jury", deadlineKey: "juryPage" },
  { href: "/destinations", label: "Destinations", deadlineKey: "destinationsPage" },
];

const progressStartDate = new Date("2026-08-03T00:00:00");
const progressEndDate = new Date("2026-12-31T23:59:59");
const showHeaderEventName = "neverathome:show-header";
const aboutBottomScrollRequestEventName = "neverathome:about-bottom-scroll-request";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getProgress(now) {
  if (!now) return 0;

  const total = progressEndDate - progressStartDate;
  if (total <= 0) return 100;

  return clamp(((now - progressStartDate) / total) * 100, 0, 100);
}

const Header = ({
  currentPhase = null,
  isProduction = false,
  isProductionLocked = isProduction,
  onApplyClick = null,
  pageDeadlines = {},
  site = {},
}) => {
  const { isMobile } = useContext(DeviceContext);
  const router = useRouter();
  const [progressNow, setProgressNow] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);
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
    const showHeader = () => {
      setIsHeaderHidden(false);
      lastScrollYRef.current = window.scrollY;
    };

    router.events.on("routeChangeComplete", closeMenu);
    router.events.on("routeChangeError", closeMenu);
    router.events.on("routeChangeStart", showHeader);
    window.addEventListener(showHeaderEventName, showHeader);

    return () => {
      router.events.off("routeChangeComplete", closeMenu);
      router.events.off("routeChangeError", closeMenu);
      router.events.off("routeChangeStart", showHeader);
      window.removeEventListener(showHeaderEventName, showHeader);
    };
  }, [router.events]);

  useEffect(() => {
    const scrollThreshold = 8;
    const topThreshold = 24;
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= topThreshold || isMenuOpen) {
        setIsHeaderHidden(false);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (Math.abs(scrollDelta) < scrollThreshold) return;

      setIsHeaderHidden(scrollDelta > 0);
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

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
    if (!isProductionLocked && router.pathname !== href) return;

    event.preventDefault();
  };

  const handleHomeLinkClick = (event) => {
    if (isProductionLocked) {
      if (router.pathname !== "/") {
        event.preventDefault();
        router.replace("/", undefined, { scroll: false }).catch(() => {});
      }
      return;
    }

    if (router.pathname !== "/") return;

    event.preventDefault();
    document.getElementById("home-schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleContactClick = (event) => {
    event.preventDefault();
    if (isProductionLocked) return;

    setIsMenuOpen(false);
    window.dispatchEvent(new CustomEvent(aboutBottomScrollRequestEventName));

    if (router.pathname === "/about") return;

    router.push("/about", undefined, { scroll: false }).catch(() => {});
  };

  const handleSpacingDebugToggle = () => {
    if (isProductionLocked) return;

    const url = new URL(window.location.href);
    const queryValue = url.searchParams.get("spacingDebug");
    const isEnabled = queryValue ? queryValue === "1" : window.localStorage.getItem("spacingDebug") === "1";
    const nextIsEnabled = !isEnabled;

    url.searchParams.set("spacingDebug", nextIsEnabled ? "1" : "0");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);

    if (nextIsEnabled) {
      window.localStorage.setItem("spacingDebug", "1");
      document.documentElement.dataset.spacingDebug = "true";
    } else {
      window.localStorage.removeItem("spacingDebug");
      delete document.documentElement.dataset.spacingDebug;
      document.getElementById("spacing-debug-overlay")?.remove();
      document.getElementById("spacing-debug-overlay-form")?.remove();
    }

    window.dispatchEvent(new CustomEvent("neverathome:spacing-debug-change", { detail: { isEnabled: nextIsEnabled } }));
    setIsMenuOpen(false);
  };

  const handleApplyClick = () => {
    if (isProductionLocked) return;

    setIsMenuOpen(false);
    onApplyClick?.();
  };

  const DisabledNavItem = ({ children, className = "" }) => (
    <span className={[styles.link, styles.linkDisabled, className].filter(Boolean).join(" ")} aria-disabled="true">
      {children}
    </span>
  );

  const DesktopNav = () => {
    const infoLink = navLinks.find((link) => link.href === "/info");

    return (
      <nav className={styles.nav} typo="h4 compensate">
        <div className={styles.phases}>
          {currentPhaseLabel ? (
            <span
              className={[styles.navItem, styles.phaseItem].filter(Boolean).join(" ")}
              {...(!isProductionLocked ? { "data-random-hover-color": true } : {})}
            >
              <Link
                className={[getLinkClassName("/"), styles.phaseLink].filter(Boolean).join(" ")}
                href="/"
                onClick={handleHomeLinkClick}
              >
                {currentPhaseLabel}
              </Link>
              <CountdownSlot
                className={styles.countdown}
                deadline={infoLink?.deadline}
                ghostClassName={styles.countdownGhost}
                slotClassName={styles.countdownSlot}
              />
            </span>
          ) : null}
          {navLinks.map((link) => (
            <span
              className={[
                styles.navItem,
                link.href === "/info" ? styles.navItemInfoPage : "",
                isProductionLocked ? styles.navItemDisabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
              {...(!isProductionLocked ? { "data-random-hover-color": true } : {})}
              key={link.href}
            >
              {isProductionLocked ? (
                <DisabledNavItem>{link.label}</DisabledNavItem>
              ) : (
                <Link className={getLinkClassName(link.href)} href={link.href} onClick={preventSameRouteNavigation(link.href)}>
                  {link.label}
                </Link>
              )}
              {link.href !== "/info" ? <CountdownText className={styles.countdown} deadline={link.deadline} /> : null}
            </span>
          ))}
        </div>
        <div>
          {isProductionLocked ? (
            <DisabledNavItem>About</DisabledNavItem>
          ) : (
            <Link className={getLinkClassName("/about")} href="/about" onClick={preventSameRouteNavigation("/about")}>
              About
            </Link>
          )}
          <span className={isProductionLocked ? styles.linkSeparatorDisabled : ""}>{",\u00a0"}</span>
          {isProductionLocked ? (
            <DisabledNavItem>Contact</DisabledNavItem>
          ) : (
            <a className={styles.link} data-manual-navigation href="/about" onClick={handleContactClick}>
              Contact
            </a>
          )}
        </div>
      </nav>
    );
  };

  const MobileNav = () => {
    const infoLink = navLinks.find((link) => link.href === "/info");

    if (!infoLink) return null;

    return (
      <nav className={styles.nav} typo={isMobile ? "h3 compensate" : "h4 compensate"}>
        <span
          className={styles.navItem}
          {...(!isProductionLocked ? { "data-random-hover-color": true } : {})}
        >
          <Link
            className={[getLinkClassName("/"), isProductionLocked ? styles.phaseLink : ""].filter(Boolean).join(" ")}
            href={"/"}
            onClick={isProductionLocked ? handleHomeLinkClick : preventSameRouteNavigation(infoLink.href)}
          >
            {isProductionLocked ? currentPhaseLabel : "Open Call"}
          </Link>
          {isProductionLocked ? null : <CountdownText className={styles.countdown} deadline={infoLink.deadline} />}
        </span>
        <button
          className={[
            styles.menuButton,
            isMenuOpen ? styles.menuButtonOpen : "",
            isProductionLocked ? styles.menuButtonDisabled : "",
          ]
            .filter(Boolean)
            .join(" ")}
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          disabled={isProductionLocked}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <motion.span
            animate={{ rotate: isMenuOpen ? 18.3 : 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            animate={{ rotate: isMenuOpen ? -18.3 : 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </button>
      </nav>
    );
  };

  return (
    <header className={[styles.header, isHeaderHidden ? styles.headerHidden : ""].filter(Boolean).join(" ")}>
      <Progressbar />
      {isMobile ? MobileNav() : DesktopNav()}
      <AnimatePresence>
        {isMobile && isMenuOpen ? (
          <Menu
            currentPhaseLabel={currentPhaseLabel}
            isProductionLocked={isProductionLocked}
            navLinks={navLinks}
            email={site.email}
            onApplyClick={handleApplyClick}
            onContactClick={handleContactClick}
            onSpacingDebugToggle={handleSpacingDebugToggle}
          />
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Header;
