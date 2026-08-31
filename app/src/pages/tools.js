import { useEffect, useRef, useState } from "react";

import Globe from "@/components/Globe/Globe";

import { getDestinations, getPage, getSite } from "@/lib/sanity";
import { getGlobeTextureUrl } from "@/lib/globeTexture";

import styles from "@/styles/Tools.module.scss";

export async function exportCanvas({
  canvasRef,
  layerRef,
  sourceWidth,
  sourceHeight,
  images = [],
  stamps = [],
  width = 3000,
  height = 3000,
  scale = 2,
  quality = 0.9,
}) {
  if (!canvasRef?.current) return;

  const sourceCanvas = canvasRef.current;
  const sourceLayer = layerRef?.current || sourceCanvas;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = Math.round(width * scale);
  tempCanvas.height = Math.round(height * scale);

  const ctx = tempCanvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const normalizedSourceWidth = Number(sourceWidth) > 0 ? sourceWidth : sourceLayer.clientWidth || sourceCanvas.clientWidth || sourceCanvas.width;
  const normalizedSourceHeight =
    Number(sourceHeight) > 0 ? sourceHeight : sourceLayer.clientHeight || sourceCanvas.clientHeight || sourceCanvas.height;

  const sourceCropSize = Math.min(normalizedSourceHeight, normalizedSourceWidth);
  const sourceCropX = (normalizedSourceWidth - sourceCropSize) / 2;
  const sourceCropY = (normalizedSourceHeight - sourceCropSize) / 2;
  const scaleX = width / sourceCropSize;
  const scaleY = height / sourceCropSize;

  const hasStamps = Array.isArray(stamps) && stamps.length > 0;

  if (!hasStamps) {
    const sourcePixelScaleX = sourceCanvas.width / normalizedSourceWidth;
    const sourcePixelScaleY = sourceCanvas.height / normalizedSourceHeight;

    ctx.drawImage(
      sourceCanvas,
      sourceCropX * sourcePixelScaleX,
      sourceCropY * sourcePixelScaleY,
      sourceCropSize * sourcePixelScaleX,
      sourceCropSize * sourcePixelScaleY,
      0,
      0,
      width,
      height,
    );
  } else {
    const imageCache = new Map();

    const loadByIndex = (index) => {
      if (imageCache.has(index)) return imageCache.get(index);

      const url = images?.[index]?.url;
      if (!url) {
        imageCache.set(index, null);
        return null;
      }

      const promise = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });

      imageCache.set(index, promise);
      return promise;
    };

    for (const stamp of stamps) {
      const imageIndex = Number(stamp?.imageIndex);
      if (!Number.isFinite(imageIndex)) continue;

      const img = await loadByIndex(imageIndex);
      if (!img) continue;

      const stampWidth = Number(stamp?.width) || 0;
      const stampHeight = Number(stamp?.height) || 0;
      const stampX = Number(stamp?.x) || 0;
      const stampY = Number(stamp?.y) || 0;

      if (stampWidth <= 0 || stampHeight <= 0) continue;

      const outWidth = stampWidth * scaleX;
      const outHeight = stampHeight * scaleY;
      const outX = (stampX - sourceCropX) * scaleX - outWidth / 2;
      const outY = (stampY - sourceCropY) * scaleY - outHeight / 2;

      ctx.drawImage(img, outX, outY, outWidth, outHeight);
    }
  }

  if (sourceLayer) {
    const layerBounds = sourceLayer.getBoundingClientRect();
    const labelSvgs = Array.from(sourceLayer.querySelectorAll("svg[aria-label]"));

    for (const svg of labelSvgs) {
      const marker = svg.closest("button");
      if (marker && getComputedStyle(marker).opacity === "0") continue;

      const bounds = svg.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) continue;

      const svgClone = svg.cloneNode(true);
      const clonePaths = Array.from(svgClone.querySelectorAll("path"));
      const sourcePaths = Array.from(svg.querySelectorAll("path"));

      svgClone.setAttribute("width", `${bounds.width}`);
      svgClone.setAttribute("height", `${bounds.height}`);
      svgClone.setAttribute("overflow", "visible");
      svgClone.style.width = `${bounds.width}px`;
      svgClone.style.height = `${bounds.height}px`;
      svgClone.style.display = "block";
      svgClone.style.overflow = "visible";

      clonePaths.forEach((path, index) => {
        const sourcePath = sourcePaths[index];
        const computedStyle = sourcePath ? getComputedStyle(sourcePath) : null;
        const fallbackFill = index === clonePaths.length - 1 ? "#fff" : "#000";
        const fill = computedStyle?.fill && computedStyle.fill !== "none" ? computedStyle.fill : fallbackFill;

        path.setAttribute("fill", fill);
        path.setAttribute("stroke", "none");
        path.removeAttribute("class");
        path.style.fill = fill;
        path.style.stroke = "none";
      });

      const serializedSvg = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([serializedSvg], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const labelImage = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = svgUrl;
      });

      URL.revokeObjectURL(svgUrl);
      if (!labelImage) continue;

      const labelX = (bounds.left - layerBounds.left - sourceCropX) * scaleX;
      const labelY = (bounds.top - layerBounds.top - sourceCropY) * scaleY;
      const labelWidth = bounds.width * scaleX;
      const labelHeight = bounds.height * scaleY;

      ctx.drawImage(labelImage, labelX, labelY, labelWidth, labelHeight);
    }
  }

  const blob = await new Promise((resolve) => tempCanvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return;

  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = "highres-export.jpg";
  link.click();
  URL.revokeObjectURL(objectUrl);
}

const ToolsPage = ({ destinations = [], page = {} }) => {
  const canvasRef = useRef(null);
  const layerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const globeTextureUrl = getGlobeTextureUrl(page.globeTexture?.asset?.url);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth || 1,
        height: window.innerHeight || 1,
      });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  const handleRender = () => {
    exportCanvas({
      canvasRef,
      layerRef,
      sourceWidth: viewportSize.width,
      sourceHeight: viewportSize.height,
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.globeLayer} ref={layerRef}>
        <Globe
          canvasRef={canvasRef}
          cities={destinations}
          globeImageUrl={globeTextureUrl}
          height={viewportSize.height}
          preserveDrawingBuffer
          width={viewportSize.width}
        />
      </div>
      <button className={styles.renderButton} onClick={handleRender} type="button" typo="h4 compensate">
        Render
      </button>
    </main>
  );
};

export default ToolsPage;

export async function getStaticProps() {
  const [site, page, destinations] = await Promise.all([getSite(), getPage(), getDestinations()]);

  return {
    props: {
      site,
      page,
      destinations,
    },
    revalidate: 60,
  };
}
