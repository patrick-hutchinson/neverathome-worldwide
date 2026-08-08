import { useEffect, useMemo, useRef, useState } from "react";

import Text from "@/components/Text/Text";

import styles from "./Marquee.module.css";

const MARQUEE_TARGET_SPEED = 1;
const MARQUEE_BASE_DURATION = 42;
const MARQUEE_MIN_REPEAT_COUNT = 2;
const MARQUEE_SCROLLABLE_WIDTH_MULTIPLIER = 3;

const getMarqueeDuration = (itemWidth, targetSpeed) => {
  if (!itemWidth || targetSpeed <= 0) return MARQUEE_BASE_DURATION;

  return Math.max(6, (itemWidth / 1200) * MARQUEE_BASE_DURATION * (1 / targetSpeed));
};

const Marquee = ({ text, className = "", direction = "forward", targetSpeed = MARQUEE_TARGET_SPEED, typo }) => {
  const outerRef = useRef(null);
  const measureRef = useRef(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [repeatCount, setRepeatCount] = useState(MARQUEE_MIN_REPEAT_COUNT);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isAnimating = isInView && isDocumentVisible && !prefersReducedMotion && targetSpeed > 0 && itemWidth > 0;
  const slides = useMemo(() => Array.from({ length: repeatCount }), [repeatCount]);
  const duration = getMarqueeDuration(itemWidth, targetSpeed);
  const animationDirection = direction === "backward" ? "reverse" : "normal";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    const updateVisibility = () => setIsDocumentVisible(document.visibilityState === "visible");

    updatePreference();
    updateVisibility();
    mediaQuery.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return undefined;

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    });

    intersectionObserver.observe(outer);

    return () => {
      intersectionObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const measure = measureRef.current;
    if (!outer || !measure) return undefined;

    const updateMetrics = () => {
      const containerWidth = outer.clientWidth || window.innerWidth || 1;
      const nextItemWidth = measure.scrollWidth || 1;
      const minimumScrollableWidth = containerWidth * MARQUEE_SCROLLABLE_WIDTH_MULTIPLIER;
      const nextRepeatCount = Math.max(
        MARQUEE_MIN_REPEAT_COUNT,
        Math.ceil(minimumScrollableWidth / nextItemWidth) + 1,
      );

      setItemWidth(nextItemWidth);
      setRepeatCount(nextRepeatCount);
    };

    updateMetrics();

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(outer);
    resizeObserver.observe(measure);
    window.addEventListener("resize", updateMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [text]);

  return (
    <div
      className={`${styles.carousel_outer} ${className}`}
      ref={outerRef}
      style={{
        "--marquee-distance": `${itemWidth}px`,
        "--marquee-duration": `${duration}s`,
        "--marquee-direction": animationDirection,
      }}
    >
      <div
        className={[styles.carousel_inner, isAnimating ? styles.isAnimating : ""].filter(Boolean).join(" ")}
        typo={`${typo} compensate`}
      >
        {slides.map((_, index) => (
          <span className={styles.slide} key={index}>
            <Text text={text} />
          </span>
        ))}
      </div>
      <div ref={measureRef} className={`${styles.slide} ${styles.measure_slide}`} typo={`${typo} compensate`} aria-hidden="true">
        <Text text={text} />
      </div>
    </div>
  );
};

export default Marquee;
