import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import Text from "@/components/Text/Text";

import styles from "./Marquee.module.css";

const Marquee = ({ text, className, typo }) => {
  const outerRef = useRef(null);
  const measureRef = useRef(null);
  const [repeatCount, setRepeatCount] = useState(8);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: true, dragResistance: 1 }, [
    AutoScroll({
      playOnInit: true,
      stopOnInteraction: false, // <-- here
      stopOnMouseEnter: false, // <— optional: keep scrolling even on hover
      speed: 1,
    }),
  ]);

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

    emblaApi.reInit();
    window.requestAnimationFrame(() => {
      emblaApi.plugins()?.autoScroll?.play?.(0);
    });
  }, [emblaApi, repeatCount]);

  const slides = useMemo(() => Array.from({ length: repeatCount }), [repeatCount]);

  return (
    <div
      className={`${styles.carousel_outer} ${className}`}
      ref={(node) => {
        outerRef.current = node;
        emblaRef(node);
      }}
      typo={typo}
    >
      <div className={`${styles.carousel_inner}`}>
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
