import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import RenderSVG from "@/components/RenderSVG/RenderSVG";
import Text from "@/components/Text/Text";
import { applicationDeclarations } from "@/lib/applicationFormConfig";

import styles from "./ApplicationSubmission.module.scss";

export const declarations = applicationDeclarations;

const LogoLink = ({ logo }) => (
  <a href={logo.asset.url} target="_blank" rel="noreferrer">
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

function getRandomTextColor(textColorPalette = []) {
  if (textColorPalette.length === 0) return null;

  return textColorPalette[Math.floor(Math.random() * textColorPalette.length)];
}

function getNextColorMap(currentColorMap, value, textColorPalette) {
  if (currentColorMap[value]) return currentColorMap;

  const nextColor = getRandomTextColor(textColorPalette);
  if (!nextColor) return currentColorMap;

  return {
    ...currentColorMap,
    [value]: nextColor,
  };
}

const ApplicationSubmission = ({
  hasRequiredError = false,
  onImprintClick,
  page = {},
  site = {},
  textColorPalette = [],
}) => {
  const [acceptedDeclarations, setAcceptedDeclarations] = useState([]);
  const [selectedColorMap, setSelectedColorMap] = useState({});
  const logos = (page.mediaPartner || []).filter((logo) => logo?.asset?.url);

  const toggleDeclaration = (declaration) => {
    setSelectedColorMap((currentColorMap) => getNextColorMap(currentColorMap, declaration, textColorPalette));
    setAcceptedDeclarations((currentDeclarations) =>
      currentDeclarations.includes(declaration)
        ? currentDeclarations.filter((currentDeclaration) => currentDeclaration !== declaration)
        : [...currentDeclarations, declaration],
    );
  };

  return (
    <section className={styles.submission}>
      <fieldset className={styles.declarations} typo="h5 compensate">
        <legend className={`${styles.declarationsLegend} ${styles.legend}`} typo="h4 compensate">
          <span>Declarations</span>
          {hasRequiredError ? (
            <span className={styles.requiredNote} typo="h6">
              Required
            </span>
          ) : null}
        </legend>
        <p>Please confirm the following:</p>
        <div className={styles.declarationList}>
          {declarations.map((declaration) => (
            <label
              className={styles.declaration}
              key={declaration}
              style={{ "--form-choice-selected-color": selectedColorMap[declaration] }}
            >
              <input
                checked={acceptedDeclarations.includes(declaration)}
                name="declarations"
                onChange={() => toggleDeclaration(declaration)}
                required
                type="checkbox"
                value={declaration}
              />
              <span>{declaration}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.submissionFooter} typo="h5">
        <Text className={styles.claim} text={page.claim} typo="h6" />

        <button className={styles.submitButton} type="submit">
          <RenderSVG className={styles.submitLabel} text="SUBMIT NOW" />
        </button>

        <LogoShuffle logos={logos} />

        {site.instagram ? (
          <a className={styles.instagramLink} href={site.instagram} target="_blank" rel="noreferrer" typo="h6">
            Instagram
          </a>
        ) : null}

        <nav className={styles.legalLinks} typo="h6">
          <button onClick={onImprintClick} type="button">
            Imprint
          </button>
          {",\u00a0"}
          <button onClick={onImprintClick} type="button">
            Privacy Policy
          </button>
        </nav>

        {logos.length > 0 ? (
          <div className={styles.desktopLogos}>
            {logos.map((logo) => (
              <LogoLink key={logo.asset.url} logo={logo} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ApplicationSubmission;
