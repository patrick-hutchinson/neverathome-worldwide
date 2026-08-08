export const LargeSection = ({ children, className }) => {
  return (
    <section className={className} style={{ marginBottom: "var(--spacing-1)" }}>
      {children}
    </section>
  );
};

export const MediumSection = ({ children, className }) => {
  return (
    <section className={className} style={{ marginBottom: "var(--spacing-4)" }}>
      {children}
    </section>
  );
};
