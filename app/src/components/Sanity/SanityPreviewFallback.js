const FALLBACK_MESSAGE = "Dieses Feld ist in Sanity nicht befüllt. Die Nachricht wird nur auf der Preview Seite angezeigt.";

const getFallbackMessage = (fieldTitle) =>
  fieldTitle
    ? `Dieses Feld (\`${fieldTitle}\`) ist in Sanity nicht befüllt. Die Nachricht wird nur auf der Preview Seite angezeigt.`
    : FALLBACK_MESSAGE;

export const isSanityPreviewEnvironment = process.env.NEXT_PUBLIC_VERCEL_ENV !== "production";

export const hasSanityValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
};

export const hasMissingSanityData = (...values) => values.some((value) => !hasSanityValue(value));

export const shouldShowSanityPreviewFallback = (...values) => isSanityPreviewEnvironment && hasMissingSanityData(...values);

export default function SanityPreviewFallback({ as: Element = "div", className = "", fieldTitle, children }) {
  if (!isSanityPreviewEnvironment) return null;

  return (
    <Element
      className={className}
      style={{
        display: "inline",
        fontSize: "0.15rem",
        lineHeight: 1,
        opacity: 0.65,
      }}
    >
      {children || getFallbackMessage(fieldTitle)}
    </Element>
  );
}

export function SanityPreviewValue({ value, children, as = "span", className = "", fieldTitle }) {
  if (hasSanityValue(value)) return children || value;

  return <SanityPreviewFallback as={as} className={className} fieldTitle={fieldTitle} />;
}
