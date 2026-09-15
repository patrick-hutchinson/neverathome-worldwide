import { useMemo } from "react";

import { useTextColorPalette } from "@/context/TextColorContext";

function getSeededIndex(seed = "", length = 0) {
  if (length <= 0) return -1;

  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % length;
}

const Placeholder = ({ medium, isLoaded }) => {
  const textColorPalette = useTextColorPalette();
  const seed = `${medium?.type || ""}:${medium?.url || medium?.playbackId || medium?._id || ""}`;
  const backgroundColor = useMemo(() => {
    const colorIndex = getSeededIndex(seed, textColorPalette.length);

    return colorIndex >= 0 ? textColorPalette[colorIndex] : "var(--accent)";
  }, [seed, textColorPalette]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        backgroundColor,
        opacity: isLoaded ? 0 : 1,
        transition: "opacity 0.5s ease 0.5s",
        zIndex: 3,
      }}
    />
  );
};

export default Placeholder;
