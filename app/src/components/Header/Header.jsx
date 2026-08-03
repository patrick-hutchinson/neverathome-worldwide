import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getCurrentPhaseLabel } from "@/lib/phase";
import styles from "./Header.module.css";

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

function getCountdownParts(deadline, now) {
  if (!deadline) return null;

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return null;
  if (deadlineDate <= now) return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  let cursor = new Date(now);
  let months = 0;
  let nextMonth = new Date(cursor);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  while (nextMonth <= deadlineDate) {
    months += 1;
    cursor = nextMonth;
    nextMonth = new Date(cursor);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
  }

  let remainingSeconds = Math.floor((deadlineDate - cursor) / 1000);
  const weeks = Math.floor(remainingSeconds / (7 * 24 * 60 * 60));
  remainingSeconds -= weeks * 7 * 24 * 60 * 60;

  const days = Math.floor(remainingSeconds / (24 * 60 * 60));
  remainingSeconds -= days * 24 * 60 * 60;

  const hours = Math.floor(remainingSeconds / (60 * 60));
  remainingSeconds -= hours * 60 * 60;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds - minutes * 60;

  return { months, weeks, days, hours, minutes, seconds };
}

function formatCountdown(deadline, now) {
  const parts = getCountdownParts(deadline, now);
  if (!parts) return null;

  return [parts.months, parts.weeks, parts.days, parts.hours, parts.minutes, parts.seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

const Header = ({ currentPhase = null, pageDeadlines = {}, site = {} }) => {
  const [now, setNow] = useState(null);
  const [progressNow, setProgressNow] = useState(null);
  const currentPhaseLabel = getCurrentPhaseLabel(currentPhase);
  const navLinks = useMemo(
    () =>
      links.map((link) => ({
        ...link,
        countdown: now ? formatCountdown(pageDeadlines[link.deadlineKey], now) : null,
      })),
    [now, pageDeadlines],
  );

  useEffect(() => {
    const initialNow = new Date();

    setNow(initialNow);
    setProgressNow(initialNow);

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const Progressbar = () => {
    return (
      <div className={styles.progressbar}>
        <div className={styles.progressbarFill} style={{ width: `${getProgress(progressNow)}%` }} />
      </div>
    );
  };

  return (
    <header className={styles.header} typo="h3">
      <Progressbar />
      <nav className={styles.nav}>
        <div className={styles.phases}>
          {currentPhaseLabel ? <span className={styles.link}>{currentPhaseLabel}</span> : null}
          {navLinks.map((link) => (
            <Link className={styles.link} href={link.href} key={link.href}>
              <span>{link.label}</span>
              {link.countdown ? <span className={styles.countdown}>{link.countdown}</span> : null}
            </Link>
          ))}
        </div>
        <div>
          <Link className={styles.link} href="about">
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
    </header>
  );
};

export default Header;
