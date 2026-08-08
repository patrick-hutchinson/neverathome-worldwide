import { useEffect } from "react";

const spacingKeys = ["1", "2", "3", "4", "5", "6", "7", "8"];
const overlayId = "spacing-debug-overlay";

function parsePixelValue(value) {
  const number = Number.parseFloat(value);

  return Number.isFinite(number) ? number : 0;
}

function getMatchingSpacing(value, spacingTokens) {
  return spacingTokens.find((token) => Math.abs(token.size - value) < 0.5);
}

function getSpacingTokens() {
  const rootStyles = window.getComputedStyle(document.documentElement);

  return spacingKeys
    .map((key) => ({
      size: parsePixelValue(rootStyles.getPropertyValue(`--spacing-${key}`)),
      color: rootStyles.getPropertyValue(`--spacing-debug-${key}`).trim(),
    }))
    .filter((token) => token.size > 0 && token.color);
}

function createOverlayLayer() {
  const existingOverlay = document.getElementById(overlayId);

  if (existingOverlay) {
    existingOverlay.replaceChildren();
    return existingOverlay;
  }

  const overlay = document.createElement("div");
  overlay.id = overlayId;
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    pointerEvents: "none",
  });

  document.body.appendChild(overlay);

  return overlay;
}

function drawBox(overlay, { color, height, width, x, y }) {
  if (width <= 0 || height <= 0) return;

  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    background: color,
    opacity: "0.55",
  });

  overlay.appendChild(box);
}

function getPositionContextRect(element, styles) {
  if (styles.position === "fixed") {
    return {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
    };
  }

  const offsetParent = element.offsetParent || document.documentElement;

  return offsetParent.getBoundingClientRect();
}

function drawPositionOffsets(overlay, element, rect, styles, spacingTokens) {
  if (!["absolute", "fixed"].includes(styles.position)) return;

  const contextRect = getPositionContextRect(element, styles);
  const top = styles.top === "auto" ? 0 : parsePixelValue(styles.top);
  const right = styles.right === "auto" ? 0 : parsePixelValue(styles.right);
  const bottom = styles.bottom === "auto" ? 0 : parsePixelValue(styles.bottom);
  const left = styles.left === "auto" ? 0 : parsePixelValue(styles.left);
  const topToken = getMatchingSpacing(top, spacingTokens);
  const rightToken = getMatchingSpacing(right, spacingTokens);
  const bottomToken = getMatchingSpacing(bottom, spacingTokens);
  const leftToken = getMatchingSpacing(left, spacingTokens);

  if (topToken) {
    drawBox(overlay, {
      color: topToken.color,
      x: rect.left,
      y: contextRect.top,
      width: rect.width,
      height: top,
    });
  }

  if (rightToken) {
    drawBox(overlay, {
      color: rightToken.color,
      x: rect.right,
      y: rect.top,
      width: right,
      height: rect.height,
    });
  }

  if (bottomToken) {
    drawBox(overlay, {
      color: bottomToken.color,
      x: rect.left,
      y: rect.bottom,
      width: rect.width,
      height: bottom,
    });
  }

  if (leftToken) {
    drawBox(overlay, {
      color: leftToken.color,
      x: contextRect.left,
      y: rect.top,
      width: left,
      height: rect.height,
    });
  }
}

function getRenderableChildRects(element) {
  return Array.from(element.children).flatMap((child) => {
    if (child.id === overlayId || child.closest(`#${overlayId}`)) return [];

    if (window.getComputedStyle(child).display === "contents") {
      return getRenderableChildRects(child);
    }

    const rect = child.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0 ? [rect] : [];
  });
}

function getRectRows(rects) {
  return rects
    .sort((a, b) => a.top - b.top || a.left - b.left)
    .reduce((rows, rect) => {
      const row = rows.find((candidate) => rect.top < candidate.bottom - 1 && rect.bottom > candidate.top + 1);

      if (row) {
        row.top = Math.min(row.top, rect.top);
        row.right = Math.max(row.right, rect.right);
        row.bottom = Math.max(row.bottom, rect.bottom);
        row.left = Math.min(row.left, rect.left);
        row.rects.push(rect);
      } else {
        rows.push({
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          rects: [rect],
        });
      }

      return rows;
    }, []);
}

function drawGapSpacing(overlay, element, rect, styles, spacingTokens) {
  if (!["flex", "inline-flex", "grid", "inline-grid"].includes(styles.display)) return;

  const rowGap = parsePixelValue(styles.rowGap);
  const columnGap = parsePixelValue(styles.columnGap);
  const rowGapToken = getMatchingSpacing(rowGap, spacingTokens);
  const columnGapToken = getMatchingSpacing(columnGap, spacingTokens);

  if (!rowGapToken && !columnGapToken) return;

  const rows = getRectRows(getRenderableChildRects(element));

  if (columnGapToken) {
    rows.forEach((row) => {
      row.rects
        .sort((a, b) => a.left - b.left)
        .forEach((childRect, index, rowRects) => {
          const nextRect = rowRects[index + 1];
          if (!nextRect) return;

          const gap = nextRect.left - childRect.right;
          if (gap <= 0) return;

          const y = Math.min(childRect.top, nextRect.top);
          const height = Math.max(childRect.bottom, nextRect.bottom) - y;

          drawBox(overlay, {
            color: columnGapToken.color,
            x: childRect.right,
            y,
            width: gap,
            height,
          });
        });
    });
  }

  if (rowGapToken) {
    rows
      .sort((a, b) => a.top - b.top)
      .forEach((row, index) => {
        const nextRow = rows[index + 1];
        if (!nextRow) return;

        const gap = nextRow.top - row.bottom;
        if (gap <= 0) return;

        drawBox(overlay, {
          color: rowGapToken.color,
          x: rect.left,
          y: row.bottom,
          width: rect.width,
          height: gap,
        });
      });
  }
}

function drawSpacingForElement(overlay, element, spacingTokens) {
  if (element.id === overlayId || element.closest(`#${overlayId}`)) return;

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const marginTop = parsePixelValue(styles.marginTop);
  const marginRight = parsePixelValue(styles.marginRight);
  const marginBottom = parsePixelValue(styles.marginBottom);
  const marginLeft = parsePixelValue(styles.marginLeft);
  const paddingTop = parsePixelValue(styles.paddingTop);
  const paddingRight = parsePixelValue(styles.paddingRight);
  const paddingBottom = parsePixelValue(styles.paddingBottom);
  const paddingLeft = parsePixelValue(styles.paddingLeft);

  const marginTopToken = getMatchingSpacing(marginTop, spacingTokens);
  const marginRightToken = getMatchingSpacing(marginRight, spacingTokens);
  const marginBottomToken = getMatchingSpacing(marginBottom, spacingTokens);
  const marginLeftToken = getMatchingSpacing(marginLeft, spacingTokens);
  const paddingTopToken = getMatchingSpacing(paddingTop, spacingTokens);
  const paddingRightToken = getMatchingSpacing(paddingRight, spacingTokens);
  const paddingBottomToken = getMatchingSpacing(paddingBottom, spacingTokens);
  const paddingLeftToken = getMatchingSpacing(paddingLeft, spacingTokens);

  if (marginTopToken) {
    drawBox(overlay, {
      color: marginTopToken.color,
      x: rect.left - marginLeft,
      y: rect.top - marginTop,
      width: rect.width + marginLeft + marginRight,
      height: marginTop,
    });
  }

  if (marginRightToken) {
    drawBox(overlay, {
      color: marginRightToken.color,
      x: rect.right,
      y: rect.top,
      width: marginRight,
      height: rect.height,
    });
  }

  if (marginBottomToken) {
    drawBox(overlay, {
      color: marginBottomToken.color,
      x: rect.left - marginLeft,
      y: rect.bottom,
      width: rect.width + marginLeft + marginRight,
      height: marginBottom,
    });
  }

  if (marginLeftToken) {
    drawBox(overlay, {
      color: marginLeftToken.color,
      x: rect.left - marginLeft,
      y: rect.top,
      width: marginLeft,
      height: rect.height,
    });
  }

  if (paddingTopToken) {
    drawBox(overlay, {
      color: paddingTopToken.color,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: paddingTop,
    });
  }

  if (paddingRightToken) {
    drawBox(overlay, {
      color: paddingRightToken.color,
      x: rect.right - paddingRight,
      y: rect.top,
      width: paddingRight,
      height: rect.height,
    });
  }

  if (paddingBottomToken) {
    drawBox(overlay, {
      color: paddingBottomToken.color,
      x: rect.left,
      y: rect.bottom - paddingBottom,
      width: rect.width,
      height: paddingBottom,
    });
  }

  if (paddingLeftToken) {
    drawBox(overlay, {
      color: paddingLeftToken.color,
      x: rect.left,
      y: rect.top,
      width: paddingLeft,
      height: rect.height,
    });
  }

  drawPositionOffsets(overlay, element, rect, styles, spacingTokens);
  drawGapSpacing(overlay, element, rect, styles, spacingTokens);
}

function renderSpacingOverlay() {
  const spacingTokens = getSpacingTokens();
  const overlay = createOverlayLayer();

  document.querySelectorAll("body *").forEach((element) => {
    drawSpacingForElement(overlay, element, spacingTokens);
  });
}

function getInitialEnabledState() {
  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get("spacingDebug");

  if (queryValue === "1") {
    window.localStorage.setItem("spacingDebug", "1");
    document.documentElement.dataset.spacingDebug = "true";
    return true;
  }

  if (queryValue === "0") {
    window.localStorage.removeItem("spacingDebug");
    delete document.documentElement.dataset.spacingDebug;
    return false;
  }

  const isEnabled = window.localStorage.getItem("spacingDebug") === "1";

  if (isEnabled) {
    document.documentElement.dataset.spacingDebug = "true";
  } else {
    delete document.documentElement.dataset.spacingDebug;
  }

  return isEnabled;
}

const SpacingDebugOverlay = () => {
  useEffect(() => {
    if (!getInitialEnabledState()) return undefined;

    let animationFrame = null;

    const scheduleRender = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        renderSpacingOverlay();
      });
    };

    const observer = new MutationObserver((mutations) => {
      const onlyOverlayChanged = mutations.every(
        (mutation) => mutation.target.id === overlayId || mutation.target.closest?.(`#${overlayId}`),
      );

      if (!onlyOverlayChanged) {
        scheduleRender();
      }
    });

    scheduleRender();
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("scroll", scheduleRender, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleRender);
      window.removeEventListener("scroll", scheduleRender, true);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      document.getElementById(overlayId)?.remove();
      delete document.documentElement.dataset.spacingDebug;
    };
  }, []);

  return null;
};

export default SpacingDebugOverlay;
