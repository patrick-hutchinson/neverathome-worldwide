import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import styles from "./Accordion.module.css";
import Text from "../Text/Text";
import RenderSVG from "../RenderSVG/RenderSVG";

const bodyTransition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

const AccordionEntry = ({ entry }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleEntry = () => setIsOpen((currentState) => !currentState);

  return (
    <div className={styles.accordionEntry}>
      <div
        aria-expanded={isOpen}
        className={styles.header}
        onClick={toggleEntry}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleEntry();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className={styles.headerButton}>
          <div typo="h3 compensate">{entry.question}</div>
          <div
            className={[styles.openCloseButton, isOpen ? styles.openCloseButtonOpen : ""].filter(Boolean).join(" ")}
            typo="h3"
          >
            <RenderSVG className={styles.openCloseIcon} text="+" />
          </div>
        </div>
        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              animate={{ height: "auto" }}
              className={styles.body}
              exit={{ height: 0 }}
              initial={{ height: 0 }}
              transition={bodyTransition}
            >
              <motion.div
                animate={{ opacity: 1 }}
                className={styles.bodyInner}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: bodyTransition.duration }}
              >
                <Text text={entry.answer} typo="h5" />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccordionEntry;
