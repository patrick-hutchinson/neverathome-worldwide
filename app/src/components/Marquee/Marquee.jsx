import { useContext, useEffect, useMemo, useRef, useState } from "react";

import Text from "@/components/Text/Text";

import styles from "./Marquee.module.css";
import { DeviceContext } from "@/context/DeviceContext";

const MARQUEE_TARGET_SPEED = 1;
const MARQUEE_BASE_DURATION = 42;
const MARQUEE_MIN_REPEAT_COUNT = 2;
const MARQUEE_SCROLLABLE_WIDTH_MULTIPLIER = 3;
const MARQUEE_SCROLL_SPEED_DAMPING = 0.075;
const MARQUEE_SCROLL_VELOCITY_VARIABLE = "--lenis-scroll-velocity";
const MARQUEE_DEFAULT_SPEED_TRANSITION_MS = 600;

const getMarqueeDuration = (itemWidth, targetSpeed) => {
  if (!itemWidth || targetSpeed <= 0) return MARQUEE_BASE_DURATION;

  return Math.max(6, (itemWidth / 1200) * MARQUEE_BASE_DURATION * (1 / targetSpeed));
};

const Marquee = ({
  text,
  className = "",
  direction = "forward",
  speedMultiplier = 1,
  speedTransitionMs = MARQUEE_DEFAULT_SPEED_TRANSITION_MS,
  targetSpeed = MARQUEE_TARGET_SPEED,
  typo,
}) => {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const measureRef = useRef(null);
  const speedMultiplierRef = useRef(speedMultiplier);
  const visibleSpeedMultiplierRef = useRef(speedMultiplier);
  const speedTransitionMsRef = useRef(speedTransitionMs);
  const [itemWidth, setItemWidth] = useState(0);
  const [repeatCount, setRepeatCount] = useState(MARQUEE_MIN_REPEAT_COUNT);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isAnimating = isInView && isDocumentVisible && !prefersReducedMotion && targetSpeed > 0 && itemWidth > 0;
  const slides = useMemo(() => Array.from({ length: repeatCount }), [repeatCount]);
  const duration = getMarqueeDuration(itemWidth, targetSpeed);
  const animationDirection = direction === "backward" ? "reverse" : "normal";
  const { isMobile } = useContext(DeviceContext);
  const marqueeScrollSpeedMultiplier = isMobile ? 20 : 40;

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    speedTransitionMsRef.current = speedTransitionMs;
  }, [speedTransitionMs]);

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
      const nextRepeatCount = Math.max(MARQUEE_MIN_REPEAT_COUNT, Math.ceil(minimumScrollableWidth / nextItemWidth) + 1);

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

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || !isAnimating || !inner.getAnimations) return undefined;

    let animationFrame = null;
    let lastTickTime = performance.now();
    let scrollBoostPlaybackRate = 0;

    const setAnimationPlaybackRate = (nextPlaybackRate) => {
      inner.getAnimations().forEach((animation) => {
        if (typeof animation.updatePlaybackRate === "function") {
          animation.updatePlaybackRate(nextPlaybackRate);
          return;
        }

        animation.playbackRate = nextPlaybackRate;
      });
    };

    const tick = (now = performance.now()) => {
      const deltaMs = Math.min(now - lastTickTime, 100);
      lastTickTime = now;
      const speedTransitionAmount =
        speedTransitionMsRef.current <= 0 ? 1 : 1 - Math.exp((-deltaMs * 4.6) / speedTransitionMsRef.current);

      visibleSpeedMultiplierRef.current +=
        (speedMultiplierRef.current - visibleSpeedMultiplierRef.current) * speedTransitionAmount;

      const scrollVelocity = Number.parseFloat(
        document.documentElement.style.getPropertyValue(MARQUEE_SCROLL_VELOCITY_VARIABLE),
      );
      const targetScrollBoost = (Number.isFinite(scrollVelocity) ? scrollVelocity : 0) * marqueeScrollSpeedMultiplier;

      scrollBoostPlaybackRate += (targetScrollBoost - scrollBoostPlaybackRate) * MARQUEE_SCROLL_SPEED_DAMPING;
      setAnimationPlaybackRate(visibleSpeedMultiplierRef.current + scrollBoostPlaybackRate);

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      setAnimationPlaybackRate(1);
    };
  }, [isAnimating, marqueeScrollSpeedMultiplier]);

  return (
    <div
      className={`${styles.carousel_outer} ${className} ${typo === "h1" ? styles.h1 : ""}`}
      ref={outerRef}
      style={{
        "--marquee-distance": `${itemWidth}px`,
        "--marquee-duration": `${duration}s`,
        "--marquee-direction": animationDirection,
      }}
    >
      <div
        ref={innerRef}
        className={[styles.carousel_inner, isAnimating ? styles.isAnimating : ""].filter(Boolean).join(" ")}
        typo={`${typo} compensate`}
      >
        {slides.map((_, index) => (
          <span className={styles.slide} key={index}>
            <Text text={text} />
          </span>
        ))}
      </div>
      <div
        ref={measureRef}
        className={`${styles.slide} ${styles.measure_slide}`}
        typo={`${typo} compensate`}
        aria-hidden="true"
      >
        <Text text={text} />
      </div>
    </div>
  );
};

export default Marquee;
