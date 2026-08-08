import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Text from "@/components/Text/Text";

import styles from "./Marquee.module.css";

const MARQUEE_START_SPEED = 0.08;
const MARQUEE_TARGET_SPEED = 1;
const MARQUEE_RAMP_DURATION = 1200;
const MARQUEE_STOP_DURATION = 450;

function createEaseInAutoScroll({ direction, speedRef, isActiveRef }) {
  let emblaApi = null;
  let defaultScrollBody = null;
  let isDestroyed = false;

  function createScrollBody(engine) {
    const {
      location,
      previousLocation,
      offsetLocation,
      target,
      scrollTarget,
      index,
      indexPrevious,
      limit: { reachedMax, reachedMin },
      options: { loop },
    } = engine;
    const directionSign = direction === "forward" ? -1 : 1;
    const noop = () => self;
    let bodyVelocity = 0;
    let scrollDirection = 0;
    let rawLocation = location.get();
    let rawLocationPrevious = rawLocation;
    let hasSettled = false;

    function seek() {
      if (!isActiveRef.current) {
        hasSettled = true;
        return self;
      }

      hasSettled = false;
      previousLocation.set(location);
      bodyVelocity = directionSign * speedRef.current;
      rawLocation += bodyVelocity;
      location.add(bodyVelocity);
      target.set(location);
      scrollDirection = Math.sign(rawLocation - rawLocationPrevious);
      rawLocationPrevious = rawLocation;

      const currentIndex = scrollTarget.byDistance(0, false).index;

      if (index.get() !== currentIndex) {
        indexPrevious.set(index.get());
        index.set(currentIndex);
        emblaApi.emit("select");
      }

      const reachedEnd = direction === "forward" ? reachedMin(offsetLocation.get()) : reachedMax(offsetLocation.get());

      if (!loop && reachedEnd) {
        hasSettled = true;
      }

      return self;
    }

    const self = {
      direction: () => scrollDirection,
      duration: () => -1,
      velocity: () => bodyVelocity,
      settled: () => hasSettled,
      seek,
      useBaseFriction: noop,
      useBaseDuration: noop,
      useFriction: noop,
      useDuration: noop,
    };

    return self;
  }

  function play() {
    if (!emblaApi || isDestroyed || !isActiveRef.current) return;

    const engine = emblaApi.internalEngine();
    engine.scrollBody = createScrollBody(engine);
    engine.animation.start();
  }

  function stop() {
    if (!emblaApi || !defaultScrollBody) return;

    const engine = emblaApi.internalEngine();
    engine.scrollBody = defaultScrollBody;
    engine.animation.stop?.();
  }

  return {
    name: "easeInAutoScroll",
    options: {},
    init(api) {
      emblaApi = api;
      defaultScrollBody = api.internalEngine().scrollBody;
      isDestroyed = false;
      play();
    },
    destroy() {
      stop();
      isDestroyed = true;
      emblaApi = null;
    },
    play,
    stop,
  };
}

const Marquee = ({ text, className, direction = "forward", targetSpeed = MARQUEE_TARGET_SPEED, typo }) => {
  const outerRef = useRef(null);
  const measureRef = useRef(null);
  const speedAnimationRef = useRef(null);
  const speedRef = useRef(MARQUEE_START_SPEED);
  const isActiveRef = useRef(false);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [repeatCount, setRepeatCount] = useState(8);
  const isAutoScrollActive = isInView && isDocumentVisible && !prefersReducedMotion && targetSpeed > 0;
  const autoScrollPlugins = useMemo(
    () => [createEaseInAutoScroll({ direction, speedRef, isActiveRef })],
    [direction],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: true, dragResistance: 1 }, autoScrollPlugins);

  useEffect(() => {
    if (speedAnimationRef.current) {
      cancelAnimationFrame(speedAnimationRef.current);
    }

    const startTime = performance.now();
    const nextTargetSpeed = isAutoScrollActive ? targetSpeed : 0;
    const startSpeed = nextTargetSpeed > 0 && speedRef.current === 0 ? MARQUEE_START_SPEED : speedRef.current;
    const duration = nextTargetSpeed > startSpeed ? MARQUEE_RAMP_DURATION : MARQUEE_STOP_DURATION;
    const speedDelta = nextTargetSpeed - startSpeed;

    speedRef.current = startSpeed;

    const rampSpeed = (time) => {
      const progress = Math.min(1, (time - startTime) / duration);
      const easedProgress = nextTargetSpeed > startSpeed ? progress * progress * progress : 1 - (1 - progress) ** 3;
      speedRef.current = Math.max(0, startSpeed + speedDelta * easedProgress);

      if (progress < 1) {
        speedAnimationRef.current = requestAnimationFrame(rampSpeed);
      }
    };

    speedAnimationRef.current = requestAnimationFrame(rampSpeed);

    return () => {
      cancelAnimationFrame(speedAnimationRef.current);
    };
  }, [direction, isAutoScrollActive, targetSpeed, text]);

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

    const updateRepeatCount = () => {
      const containerWidth = outer.clientWidth || window.innerWidth || 1;
      const itemWidth = measure.scrollWidth || 1;
      const minimumScrollableWidth = containerWidth * 4;
      const nextRepeatCount = Math.max(8, Math.ceil(minimumScrollableWidth / itemWidth));
      setRepeatCount(nextRepeatCount);
    };

    updateRepeatCount();

    const resizeObserver = new ResizeObserver(updateRepeatCount);
    resizeObserver.observe(outer);
    resizeObserver.observe(measure);
    window.addEventListener("resize", updateRepeatCount);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateRepeatCount);
    };
  }, [text]);

  useEffect(() => {
    if (!emblaApi) return;

    isActiveRef.current = isAutoScrollActive;

    if (isAutoScrollActive) {
      emblaApi.plugins()?.easeInAutoScroll?.play?.();
      return;
    }

    emblaApi.plugins()?.easeInAutoScroll?.stop?.();
  }, [emblaApi, isAutoScrollActive]);

  useEffect(() => {
    if (!emblaApi) return undefined;

    emblaApi.reInit();
    const frameId = window.requestAnimationFrame(() => {
      if (isActiveRef.current) {
        emblaApi.plugins()?.easeInAutoScroll?.play?.();
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [emblaApi, repeatCount]);

  const slides = useMemo(() => Array.from({ length: repeatCount }), [repeatCount]);

  return (
    <div
      className={`${styles.carousel_outer} ${className}`}
      ref={(node) => {
        outerRef.current = node;
        emblaRef(node);
      }}
    >
      <div className={`${styles.carousel_inner}`} typo={`${typo} compensate`}>
        {slides.map((_, index) => (
          <li key={index}>
            <Text text={text} />
          </li>
        ))}
      </div>
      <div ref={measureRef} className={`${styles.slide} ${styles.text_slide} ${styles.measure_slide}`} aria-hidden="true">
        <Text text={text} />
      </div>
    </div>
  );
};

export default Marquee;
