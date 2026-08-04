import styles from "./ContentContainer.module.css";

const ContentContainer = ({ className, children, id }) => {
  return (
    <div className={[className, styles.contentContainer].filter(Boolean).join(" ")} id={id}>
      {children}
    </div>
  );
};

export default ContentContainer;
