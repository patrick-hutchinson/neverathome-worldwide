// context/LenisContext.js
"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

const LenisContext = createContext(null);
const SCROLL_VELOCITY_VARIABLE = "--lenis-scroll-velocity";
const SCROLL_VELOCITY_NORMALIZER = 35;
const SCROLL_VELOCITY_IDLE_DELAY = 120;

export const useLenisContext = () => useContext(LenisContext);

function LenisContextProvider({ children }) {
  const lenis = useLenis();
  const router = useRouter();
  const resetTimers = useRef([]);

  const clearResetTimers = useCallback(() => {
    resetTimers.current.forEach(({ id, type }) => {
      if (type === "frame") {
        cancelAnimationFrame(id);
        return;
      }

      clearTimeout(id);
    });
    resetTimers.current = [];
  }, []);

  const scrollToTop = useCallback(() => {
    lenis?.scrollTo?.(0, { force: true, immediate: true });
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lenis]);

  const queueScrollToTop = useCallback(() => {
    clearResetTimers();
    lenis?.stop?.();
    scrollToTop();

    const queueFrame = (callback) => {
      const id = requestAnimationFrame(callback);
      resetTimers.current.push({ id, type: "frame" });
    };

    const queueTimeout = (callback, delay) => {
      const id = setTimeout(callback, delay);
      resetTimers.current.push({ id, type: "timeout" });
    };

    queueFrame(() => {
      scrollToTop();
      lenis?.start?.();
    });
  }, [clearResetTimers, lenis, scrollToTop]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      lenis?.stop?.();
    };

    const handleRouteChangeComplete = () => {
      queueScrollToTop();
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      clearResetTimers();
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [clearResetTimers, lenis, queueScrollToTop, router.events]);

  useEffect(() => {
    queueScrollToTop();
  }, [queueScrollToTop, router.asPath]);

  useEffect(() => {
    if (!lenis) return undefined;

    const root = document.documentElement;
    let animationFrame = null;
    let idleTimer = null;
    let latestVelocity = 0;

    const commitVelocity = () => {
      root.style.setProperty(SCROLL_VELOCITY_VARIABLE, latestVelocity.toFixed(3));
      animationFrame = null;
    };

    const scheduleCommit = () => {
      if (animationFrame) return;
      animationFrame = requestAnimationFrame(commitVelocity);
    };

    const handleScroll = (event = {}) => {
      const velocity = Math.abs(Number(event.velocity ?? lenis.velocity ?? 0));
      latestVelocity = Math.min(velocity / SCROLL_VELOCITY_NORMALIZER, 1);
      scheduleCommit();

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        latestVelocity = 0;
        scheduleCommit();
      }, SCROLL_VELOCITY_IDLE_DELAY);
    };

    const unsubscribe = lenis.on?.("scroll", handleScroll);

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      } else {
        lenis.off?.("scroll", handleScroll);
      }

      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (idleTimer) clearTimeout(idleTimer);
      root.style.removeProperty(SCROLL_VELOCITY_VARIABLE);
    };
  }, [lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export default function LenisProvider({ children }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return (
    <ReactLenis
      root
      autoRaf={!prefersReducedMotion}
      options={{ stopInertiaOnNavigate: true, syncTouch: !prefersReducedMotion }}
    >
      <LenisContextProvider>{children}</LenisContextProvider>
    </ReactLenis>
  );
}
