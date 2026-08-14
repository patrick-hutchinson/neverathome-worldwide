import { PortableText } from "@portabletext/react";
import { cloneElement, isValidElement } from "react";

import Link from "next/link";

const internalPageRoutes = {
  aboutPage: "/about",
  destinationsPage: "/destinations",
  homePage: "/",
  imprint: "/imprint",
  juryPage: "/jury",
  openCallPage: "/open-call",
};

const isPortableTextBlockEmpty = (value) => {
  if (!value?.children?.length) return true;

  return value.children.every((child) => child._type === "span" && !child.text);
};

const renderSoftBreaks = (node) => {
  if (typeof node === "string") {
    return node.split("\n").flatMap((part, index) => (index === 0 ? [part] : [<br key={`br-${index}`} />, part]));
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => renderSoftBreaks(child));
  }

  if (isValidElement(node) && node.props?.children) {
    return cloneElement(node, {
      children: renderSoftBreaks(node.props.children),
    });
  }

  return [node];
};

const PortableTextParagraph = ({ children, value }) => {
  if (isPortableTextBlockEmpty(value)) return <p aria-hidden="true">&nbsp;</p>;

  return <p>{renderSoftBreaks(children)}</p>;
};

const getMailtoHref = (email) => {
  if (!email) return null;
  if (/^mailto:/i.test(email)) return email;

  return `mailto:${email}`;
};

const getInternalHref = (internalLink) => {
  const referenceId = internalLink?._ref;
  if (!referenceId) return null;

  return internalPageRoutes[referenceId] || null;
};

const PortableTextLink = ({ children, value }) => {
  if (!value) return children;

  if (value.type === "email") {
    const href = getMailtoHref(value.email);

    return href ? <a href={href}>{children}</a> : children;
  }

  if (value.type === "external") {
    return value.url ? (
      <a href={value.url} rel="noreferrer" target="_blank">
        {children}
      </a>
    ) : (
      children
    );
  }

  if (value.type === "internal") {
    const href = getInternalHref(value.internalLink);

    return href ? <Link href={href}>{children}</Link> : children;
  }

  return children;
};

const Text = ({ text, typo, className, components, style }) => {
  if (!Array.isArray(text)) {
    return text ? (
      <p typo={typo} className={className} style={{ ...style }}>
        {text}
      </p>
    ) : null;
  }

  return (
    <div className={className} typo={typo} style={{ ...style }}>
      <PortableText
        value={text}
        components={{
          ...components,
          block: {
            normal: PortableTextParagraph,
            ...components?.block,
          },
          marks: {
            link: PortableTextLink,
            ...components?.marks,
          },
        }}
      />
    </div>
  );
};

export default Text;
