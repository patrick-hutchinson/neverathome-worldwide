import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Text from "@/components/Text/Text";
import RenderSVG from "@/components/RenderSVG/RenderSVG";

import styles from "./Footer.module.css";

const getDownloadUrl = (file) => {
  const url = file?.asset?.url;
  if (!url) return null;

  const filename = file.asset.originalFilename;
  if (!filename) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}dl=${encodeURIComponent(filename)}`;
};

const FooterButton = ({ ariaLabel, children, className = "", download = null, href = null }) => {
  const buttonClassName = [styles.footerButton, className].filter(Boolean).join(" ");

  if (!href) {
    return (
      <button className={buttonClassName} aria-label={ariaLabel} type="button">
        {children}
      </button>
    );
  }

  return (
    <a
      className={buttonClassName}
      aria-label={ariaLabel}
      download={download || undefined}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
};

const LogoLink = ({ className = "", logo }) => (
  <a className={className} href={logo.asset.url} target="_blank" rel="noreferrer">
    <img src={logo.asset.url} alt={logo.asset.originalFilename || "Media partner logo"} />
  </a>
);

const LogoShuffle = ({ logos = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (logos.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % logos.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [logos.length]);

  const activeLogo = logos[activeIndex];
  if (!activeLogo) return null;

  return (
    <div className={styles.logoShuffle}>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1 }}
          className={styles.logoShuffleItem}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={activeLogo.asset.url}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <LogoLink logo={activeLogo} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const Footer = ({ page = {} }) => {
  const logos = (page.mediaPartner || []).filter((logo) => logo?.asset?.url);
  const informationPDFUrl = getDownloadUrl(page.informationPDF);

  return (
    <footer className={styles.footer}>
      <Text className={styles.claim} text={page.claim} typo="h6" />

      <div className={styles.buttonContainer} typo="h4">
        <FooterButton className={`${styles.applicationButton} invert`} ariaLabel="Apply now" href={page.formLink}>
          <RenderSVG className={styles.buttonLabel} text="APPLY NOW" />
        </FooterButton>
        <FooterButton
          ariaLabel="Info PDF"
          download={page.informationPDF?.asset?.originalFilename || true}
          href={informationPDFUrl}
        >
          <RenderSVG className={styles.buttonLabel} text="INFO.PDF" />
        </FooterButton>
      </div>

      <nav className={styles.legalLinks} typo="h6">
        <a href="/imprint">Imprint</a>
        {",\u00a0"}
        <a href="/legal">Legal</a>
      </nav>

      <LogoShuffle logos={logos} />

      {logos.length > 0 ? (
        <div className={styles.desktopLogos}>
          {logos.map((logo) => (
            <LogoLink key={logo.asset.url} logo={logo} />
          ))}
        </div>
      ) : null}
    </footer>
  );
};

export default Footer;
