import { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";

import styles from "./RenderSVG.module.css";

const DEFAULT_FONT_URL = "/fonts/TexGyreHeros-regular.ttf";
const SVG_FONT_SIZE = 1000;
const fontCache = new Map();
const fallbackBox = {
  x: 0,
  y: -SVG_FONT_SIZE,
  width: SVG_FONT_SIZE,
  height: SVG_FONT_SIZE,
};

const getPaddedBox = (box, padding = 0) => ({
  x: box.x1 - padding,
  y: box.y1 - padding,
  width: box.x2 - box.x1 + padding * 2,
  height: box.y2 - box.y1 + padding * 2,
});

const loadFont = (fontUrl) => {
  if (!fontCache.has(fontUrl)) {
    fontCache.set(
      fontUrl,
      fetch(fontUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load font: ${fontUrl}`);
          }

          return response.arrayBuffer();
        })
        .then((buffer) => opentype.parse(buffer)),
    );
  }

  return fontCache.get(fontUrl);
};

const getPathWithLetterSpacing = (font, text, letterSpacing) => {
  if (!letterSpacing) {
    return font.getPath(text, 0, 0, SVG_FONT_SIZE);
  }

  const path = new opentype.Path();
  let x = 0;

  for (const character of text) {
    const glyphPath = font.getPath(character, x, 0, SVG_FONT_SIZE);
    const advanceWidth = font.getAdvanceWidth(character, SVG_FONT_SIZE);

    path.extend(glyphPath);
    x += advanceWidth + letterSpacing;
  }

  return path;
};

const RenderSVG = ({ text, className = "", fontUrl = DEFAULT_FONT_URL, letterSpacing = 0, padding = 0 }) => {
  const [outline, setOutline] = useState(null);

  useEffect(() => {
    let isMounted = true;

    loadFont(fontUrl)
      .then((font) => {
        if (!isMounted || !text) return;

        const path = getPathWithLetterSpacing(font, text, letterSpacing);
        const box = path.getBoundingBox();
        const nextBox = getPaddedBox(box, padding);

        setOutline({
          pathData: path.toPathData(2),
          viewBox: `${nextBox.x} ${nextBox.y} ${nextBox.width} ${nextBox.height}`,
        });
      })
      .catch(() => {
        if (!isMounted) return;

        setOutline(null);
      });

    return () => {
      isMounted = false;
    };
  }, [fontUrl, letterSpacing, padding, text]);

  const viewBox = outline?.viewBox || `${fallbackBox.x} ${fallbackBox.y} ${fallbackBox.width} ${fallbackBox.height}`;
  const pathData = outline?.pathData;
  const label = useMemo(() => (typeof text === "string" ? text : ""), [text]);

  return (
    <svg
      aria-label={label}
      className={[styles.svg, className].filter(Boolean).join(" ")}
      focusable="false"
      preserveAspectRatio="xMinYMax meet"
      role="img"
      viewBox={viewBox}
    >
      {pathData ? <path className={styles.path} d={pathData} /> : null}
    </svg>
  );
};

export default RenderSVG;
