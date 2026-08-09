import { PortableText } from "@portabletext/react";
import { cloneElement, isValidElement } from "react";

import Link from "next/link";

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
            link: ({ value, children }) => {
              if (!value) return children;

              return <Link link={value}>{children}</Link>;
            },
            ...components?.marks,
          },
        }}
      />
    </div>
  );
};

export default Text;
