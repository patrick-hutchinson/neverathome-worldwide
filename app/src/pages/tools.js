import { useEffect, useRef, useState } from "react";

import Globe from "@/components/Globe/Globe";

import { getDestinations, getPage, getSite } from "@/lib/sanity";
import { getGlobeTextureUrl } from "@/lib/globeTexture";

import styles from "@/styles/Tools.module.scss";

export async function exportCanvas({
  canvasRef,
  sourceWidth,
  sourceHeight,
  images = [],
  stamps = [],
  width = 3000,
  height = 4000,
  scale = 3,
}) {
  if (!canvasRef?.current) return;

  const sourceCanvas = canvasRef.current;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = Math.round(width * scale);
  tempCanvas.height = Math.round(height * scale);

  const ctx = tempCanvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const normalizedSourceWidth = Number(sourceWidth) > 0 ? sourceWidth : sourceCanvas.clientWidth || sourceCanvas.width;
  const normalizedSourceHeight = Number(sourceHeight) > 0 ? sourceHeight : sourceCanvas.clientHeight || sourceCanvas.height;

  const sourceAspect = normalizedSourceWidth / normalizedSourceHeight;
  const targetAspect = width / height;

  let drawWidth = width;
  let drawHeight = height;

  if (sourceAspect > targetAspect) {
    drawHeight = width / sourceAspect;
  } else {
    drawWidth = height * sourceAspect;
  }

  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  const hasStamps = Array.isArray(stamps) && stamps.length > 0;

  if (!hasStamps) {
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, offsetX, offsetY, drawWidth, drawHeight);
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

    const scaleX = drawWidth / normalizedSourceWidth;
    const scaleY = drawHeight / normalizedSourceHeight;

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
      const outX = offsetX + stampX * scaleX - outWidth / 2;
      const outY = offsetY + stampY * scaleY - outHeight / 2;

      ctx.drawImage(img, outX, outY, outWidth, outHeight);
    }
  }

  const dataURL = tempCanvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "highres-export.png";
  link.click();
}

const ToolsPage = ({ destinations = [], page = {} }) => {
  const canvasRef = useRef(null);
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
      sourceWidth: viewportSize.width,
      sourceHeight: viewportSize.height,
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.globeLayer}>
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
