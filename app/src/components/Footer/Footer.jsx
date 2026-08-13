import { useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Text from "@/components/Text/Text";
import RenderSVG from "@/components/RenderSVG/RenderSVG";

import styles from "./Footer.module.css";
import { DeviceContext } from "@/context/DeviceContext";

const getDownloadUrl = (file) => {
  const url = file?.asset?.url;
  if (!url) return null;

  const filename = file.asset.originalFilename;
  if (!filename) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}dl=${encodeURIComponent(filename)}`;
};

const FooterButton = ({ ariaLabel, children, className = "", download = null, href = null, onClick }) => {
  const buttonClassName = [styles.footerButton, className].filter(Boolean).join(" ");

  if (!href) {
    return (
      <button className={buttonClassName} aria-label={ariaLabel} onClick={onClick} type="button">
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

const Footer = ({ onApplyClick, onImprintClick, page = {}, site = {} }) => {
  const { isMobile } = useContext(DeviceContext);
  const logos = (page.mediaPartner || []).filter((logo) => logo?.asset?.url);
  const informationPDFUrl = getDownloadUrl(page.informationPDF);

  return (
    <footer className={styles.footer}>
      <Text className={styles.claim} text={page.claim} typo="h6" />

      <div className={styles.buttonContainer} typo="h5">
        <FooterButton className={styles.applicationButton} ariaLabel="Apply now" onClick={onApplyClick}>
          <RenderSVG className={styles.buttonLabel} text={isMobile ? "APPLY" : "APPLY NOW"} />
        </FooterButton>
        <FooterButton
          ariaLabel="Any questions"
          download={page.informationPDF?.asset?.originalFilename || true}
          href={informationPDFUrl}
        >
          <RenderSVG className={styles.buttonLabel} text={isMobile ? "INFO.PDF" : "INFO.PDF"} />
        </FooterButton>
        <FooterButton
          ariaLabel="Info PDF"
          download={page.informationPDF?.asset?.originalFilename || true}
          href={informationPDFUrl}
        >
          <RenderSVG className={styles.buttonLabel} text={isMobile ? "ASK" : "ANY QUESTIONS"} />
        </FooterButton>
      </div>

      <nav className={styles.legalLinks} typo="h6">
        <button onClick={onImprintClick} type="button">
          Imprint
        </button>
        {",\u00a0"}
        <button onClick={onImprintClick} type="button">
          Datapolicy
        </button>
      </nav>

      <LogoShuffle logos={logos} />

      {site.instagram ? (
        <a className={styles.instagramLink} href={site.instagram} target="_blank" rel="noreferrer" typo="h6">
          Instagram
        </a>
      ) : null}

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
