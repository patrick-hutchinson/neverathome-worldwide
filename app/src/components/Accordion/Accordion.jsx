import styles from "./Accordion.module.css";
import AccordionEntry from "./AccordionEntry";

const Accordion = ({ array = [] }) => {
  if (!Array.isArray(array) || array.length === 0) return null;

  return (
    <div className={styles.accordion}>
      {array.map((entry, index) => (
        <AccordionEntry entry={entry} key={entry._key || entry.question || index} />
      ))}
    </div>
  );
};

export default Accordion;
