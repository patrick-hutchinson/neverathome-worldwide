import Text from "@/components/Text/Text";

import styles from "./Footer.module.css";

const Footer = ({ page = {} }) => {
  const logos = page.mediaPartner || [];

  return (
    <footer className={styles.footer}>
      <Text className={styles.claim} text={page.claim} typo="h6" />

      <div className={styles.buttonContainer} typo="h4">
        <button className={`${styles.registrationButton} invert`}>ONLINE REGISTRATION</button>
        <button>INFO.PDF</button>
      </div>

      <nav className={styles.legalLinks} typo="h6">
        <a href="/imprint">Imprint</a>
        {",\u00a0"}
        <a href="/legal">Legal</a>
      </nav>

      {logos.slice(0, 2).map((logo, index) => {
        if (!logo?.asset?.url) return null;

        return (
          <a
            className={index === 0 ? styles.logoOne : styles.logoTwo}
            href={logo.asset.url}
            key={logo.asset.url}
            target="_blank"
            rel="noreferrer"
          >
            <img src={logo.asset.url} alt={logo.asset.originalFilename || "Media partner logo"} />
          </a>
        );
      })}
    </footer>
  );
};

export default Footer;
