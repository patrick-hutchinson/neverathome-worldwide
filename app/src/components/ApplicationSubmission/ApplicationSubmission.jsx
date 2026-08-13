import { useState } from "react";

import RenderSVG from "@/components/RenderSVG/RenderSVG";
import Text from "@/components/Text/Text";

import styles from "./ApplicationSubmission.module.scss";

const declarations = [
  "I confirm that my primary place of residence is in Austria.",
  "I confirm that the submitted materials are my own work or that I hold all necessary rights to the submitted content.",
  "I accept the Terms and Conditions of the Open Call.",
  "I agree that my submitted biography, project materials and images may be used by NeverAtHome and the BMEIA for communication and promotional purposes related to the project if my application is selected.",
  "If selected, I agree to participate in the project from 2026-2028, including the final group exhibition in Vienna in 2028, and to cooperate with Never At Home and the BMEIA throughout the project.",
  "I consent to the processing of my personal data in accordance with the Privacy Policy.",
];

const LogoLink = ({ logo }) => (
  <a href={logo.asset.url} target="_blank" rel="noreferrer">
    <img src={logo.asset.url} alt={logo.asset.originalFilename || "Media partner logo"} />
  </a>
);

const ApplicationSubmission = ({ page = {} }) => {
  const [acceptedDeclarations, setAcceptedDeclarations] = useState([]);
  const logos = (page.mediaPartner || []).filter((logo) => logo?.asset?.url);
  const canSubmit = acceptedDeclarations.length === declarations.length;

  const toggleDeclaration = (declaration) => {
    setAcceptedDeclarations((currentDeclarations) =>
      currentDeclarations.includes(declaration)
        ? currentDeclarations.filter((currentDeclaration) => currentDeclaration !== declaration)
        : [...currentDeclarations, declaration],
    );
  };

  return (
    <section className={styles.submission}>
      <fieldset className={styles.declarations} typo="h5">
        <legend className={`${styles.declarationsLegend} ${styles.legend}`} typo="h4">
          Declarations
        </legend>
        <p>Please confirm the following:</p>
        <div className={styles.declarationList}>
          {declarations.map((declaration) => (
            <label className={styles.declaration} key={declaration}>
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

      <div className={styles.submissionFooter}>
        <Text className={styles.claim} text={page.claim} typo="h6" />

        <button className={styles.submitButton} disabled={!canSubmit} type="submit">
          <RenderSVG className={styles.submitLabel} text="SUBMIT NOW" />
        </button>

        {logos.length > 0 ? (
          <div className={styles.logos}>
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
