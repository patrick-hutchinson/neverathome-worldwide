import styles from "./ContentContainer.module.css";

const ContentContainer = ({ className, children }) => {
  return <div className={`${className} ${styles.contentContainer}`}>{children}</div>;
};

export default ContentContainer;
