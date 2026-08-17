import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import { ReactLenis } from "lenis/react";

import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import CityList from "@/components/CityList/CityList";
import ContentContainer from "@/components/ContentContainer/ContentContainer";
import Footer from "@/components/Footer/Footer";
import Globe from "@/components/Globe/Globe";
import ApplicationForm from "@/components/ApplicationForm/ApplicationForm";
import { DeviceProvider } from "@/context/DeviceContext";
import LenisProvider, { useLenisContext } from "@/context/LenisContext";
import Marquee from "@/components/Marquee/Marquee";
import { ViewportProvider } from "@/context/ViewportContext";
import Header from "@/components/Header/Header";
import { CountdownSlot } from "@/components/Countdown/Countdown";
import SpacingDebugOverlay from "@/components/SpacingDebugOverlay/SpacingDebugOverlay";
import Imprint from "@/components/Imprint/Imprint";

import { getCurrentPhaseLabel } from "@/lib/phase";
import { fallbackSiteData } from "@/lib/sanity";

import "@/styles/globals.css";
import "@/styles/fonts.css";
import styles from "@/styles/App.module.scss";

const pageTransition = { duration: 0.5, ease: "easeInOut" };

const pageTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    pointerEvents: "none",
    transition: pageTransition,
  },
};

const cityListTransition = { duration: 0.45, ease: "easeInOut" };
const cityListTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: cityListTransition },
};

// Updated Packages

const routeMarqueeLabels = {
  "/": "OpenCall",
  "/destinations": "Destinations",
  "/jury": "JuryIntl.",
  "/info": "PhaseA",
  "/about": "About",
  "/404": "404NotFound",
};

const routePagePropKeys = {
  "/": "homePage",
  "/destinations": "destinationsPage",
  "/jury": "juryPage",
  "/info": "infoPage",
  "/about": "aboutPage",
  "/imprint": "imprint",
};

const contentAutoScrollRoutes = new Set(["/jury", "/info", "/about"]);

function getRouteMarqueeText(pathname, pageProps = {}) {
  const pagePropKey = routePagePropKeys[pathname];
  const marqueeText = pagePropKey ? pageProps[pagePropKey]?.marqueeText : null;

  return typeof marqueeText === "string" && marqueeText.trim() ? marqueeText : routeMarqueeLabels[pathname];
}

const contentContainerId = "page-content";
const showHeaderEventName = "neverathome:show-header";
const pageTransitionCompleteEventName = "neverathome:page-transition-complete";
const aboutBottomScrollRequestEventName = "neverathome:about-bottom-scroll-request";
const programmaticScrollLockEventName = "neverathome:programmatic-scroll-lock";
const desktopGlobeSize = 300;
const desktopGlobeBasePosition = { x: 200, y: 200 };
const desktopGlobeViewportPadding = 24;
const desktopGlobeMinimumNavigationDistance = 300;
const desktopGlobePositionAttempts = 24;
const mobileGlobeViewportPadding = 16;
const mobileGlobeMinimumNavigationDistance = 180;
const h1MarqueeDefaultSpeed = 1;
const h1MarqueeNavigationSpeed = 100;
const h1MarqueeNavigationLeadInMs = 300;
const h1MarqueeScrollNavigationLeadInMs = 500;
const h1MarqueeNavigationSettleDelay = 0;
const h1MarqueeNavigationSpeedTransitionMs = 1000;
const navigationScrollToTopFallbackMs = 1400;
const hexColorPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function getRandomNumber(min, max) {
  if (max <= min) return min;

  return Math.random() * (max - min) + min;
}

function getPositionDistance(positionA, positionB) {
  return Math.hypot(positionA.x - positionB.x, positionA.y - positionB.y);
}

function createRandomDesktopGlobePosition() {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  const minLeft = desktopGlobeViewportPadding;
  const maxLeft = Math.max(window.innerWidth / 2 - desktopGlobeSize - desktopGlobeViewportPadding, minLeft);
  const minTop = desktopGlobeViewportPadding;
  const maxTop = Math.max(window.innerHeight - desktopGlobeSize - desktopGlobeViewportPadding, minTop);
  const left = getRandomNumber(minLeft, maxLeft);
  const top = getRandomNumber(minTop, maxTop);

  return {
    x: left - desktopGlobeBasePosition.x,
    y: top - desktopGlobeBasePosition.y,
  };
}

function getRandomDesktopGlobePosition(currentPosition = { x: 0, y: 0 }) {
  let farthestPosition = createRandomDesktopGlobePosition();
  let farthestDistance = getPositionDistance(currentPosition, farthestPosition);

  for (let attempt = 0; attempt < desktopGlobePositionAttempts; attempt += 1) {
    const nextPosition = createRandomDesktopGlobePosition();
    const nextDistance = getPositionDistance(currentPosition, nextPosition);

    if (nextDistance >= desktopGlobeMinimumNavigationDistance) {
      return nextPosition;
    }

    if (nextDistance > farthestDistance) {
      farthestPosition = nextPosition;
      farthestDistance = nextDistance;
    }
  }

  return farthestPosition;
}

function createRandomMobileGlobePosition() {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  const mobileGlobeSize = window.innerWidth * 0.5;
  const centeredLeft = (window.innerWidth - mobileGlobeSize) / 2;
  const centeredTop = (window.innerHeight - mobileGlobeSize) / 2;
  const minLeft = 0;
  const maxLeft = Math.max(window.innerWidth / 2 - mobileGlobeSize, minLeft);
  const minTop = mobileGlobeViewportPadding;
  const maxTop = Math.max(window.innerHeight - mobileGlobeSize - mobileGlobeViewportPadding, minTop);
  const left = getRandomNumber(minLeft, maxLeft);
  const top = getRandomNumber(minTop, maxTop);

  return {
    x: left - centeredLeft,
    y: top - centeredTop,
  };
}

function clampMobileGlobePosition(position = { x: 0, y: 0 }) {
  if (typeof window === "undefined") return position;

  const mobileGlobeSize = window.innerWidth * 0.5;
  const centeredLeft = (window.innerWidth - mobileGlobeSize) / 2;
  const centeredTop = (window.innerHeight - mobileGlobeSize) / 2;
  const minLeft = 0;
  const maxLeft = Math.max(window.innerWidth / 2 - mobileGlobeSize, minLeft);
  const minTop = mobileGlobeViewportPadding;
  const maxTop = Math.max(window.innerHeight - mobileGlobeSize - mobileGlobeViewportPadding, minTop);
  const currentLeft = centeredLeft + position.x;
  const currentTop = centeredTop + position.y;
  const left = Math.min(Math.max(currentLeft, minLeft), maxLeft);
  const top = Math.min(Math.max(currentTop, minTop), maxTop);

  return {
    x: left - centeredLeft,
    y: top - centeredTop,
  };
}

function getRandomMobileGlobePosition(currentPosition = { x: 0, y: 0 }) {
  let farthestPosition = createRandomMobileGlobePosition();
  let farthestDistance = getPositionDistance(currentPosition, farthestPosition);

  for (let attempt = 0; attempt < desktopGlobePositionAttempts; attempt += 1) {
    const nextPosition = createRandomMobileGlobePosition();
    const nextDistance = getPositionDistance(currentPosition, nextPosition);

    if (nextDistance >= mobileGlobeMinimumNavigationDistance) {
      return nextPosition;
    }

    if (nextDistance > farthestDistance) {
      farthestPosition = nextPosition;
      farthestDistance = nextDistance;
    }
  }

  return farthestPosition;
}

function getRandomDestination(destinations = []) {
  if (destinations.length === 0) return null;

  return destinations[Math.floor(Math.random() * destinations.length)];
}

function getTextColorPalette(textColors = []) {
  return (textColors || []).map((color) => color?.hexCode).filter((hexCode) => hexColorPattern.test(hexCode));
}

function getRandomTextColor(textColorPalette = []) {
  if (textColorPalette.length === 0) return null;

  return textColorPalette[Math.floor(Math.random() * textColorPalette.length)];
}

function getRootCssPixelValue(customPropertyName) {
  if (typeof window === "undefined") return 0;

  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(customPropertyName).trim();
  const parsedValue = parseFloat(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getGlobeTextureUrl(textureUrl) {
  if (!textureUrl) return undefined;

  try {
    const url = new URL(textureUrl);

    if (url.hostname === "cdn.sanity.io") {
      return `/api/globe-texture?url=${encodeURIComponent(textureUrl)}`;
    }
  } catch {
    return undefined;
  }

  return textureUrl;
}

function ApplicationFormOverlay({
  currentPhaseLabel = null,
  destinations = [],
  isOpen,
  onClose,
  onDirtyChange,
  onHomeClick,
  onOpenComplete,
  page = {},
  pageDeadlines = {},
}) {
  const lenis = useLenisContext();
  const infoDeadline = pageDeadlines.infoPage;

  useEffect(() => {
    if (!isOpen) return undefined;

    lenis?.stop?.();

    return () => {
      lenis?.start?.();
    };
  }, [isOpen, lenis]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate="open"
          className={styles.applicationFormLayer}
          exit="closed"
          id="application-form-layer"
          initial="closed"
          onAnimationComplete={(definition) => {
            if (definition === "open") {
              onOpenComplete?.();
            }
          }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          variants={{
            closed: { y: "100%" },
            open: { y: 0 },
          }}
        >
          <div className={styles.applicationFormHeader} typo="h4 compensate">
            <div className={styles.applicationFormHeaderLeft}>
              {currentPhaseLabel ? (
                <button className={styles.applicationFormHeaderPhase} onClick={onHomeClick} type="button">
                  <span>{currentPhaseLabel}</span>
                  <CountdownSlot
                    className={styles.applicationFormHeaderCountdown}
                    deadline={infoDeadline}
                    ghostClassName={styles.applicationFormHeaderCountdownGhost}
                    slotClassName={styles.applicationFormHeaderCountdownSlot}
                  />
                </button>
              ) : null}
              <span>Application Form</span>
            </div>
            <button className={styles.applicationFormHeaderClose} onClick={onClose} type="button">
              Close
            </button>
          </div>
          <ReactLenis
            className={styles.applicationFormScroller}
            options={{ allowNestedScroll: true, lerp: 0.12, syncTouch: true }}
            root={false}
          >
            <ApplicationForm destinations={destinations} onDirtyChange={onDirtyChange} page={page} />
            <SpacingDebugOverlay overlayId="spacing-debug-overlay-form" rootSelector="#application-form-layer" />
          </ReactLenis>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [sharedData, setSharedData] = useState({
    site: pageProps.site || null,
    page: pageProps.page || null,
    pageDeadlines: pageProps.pageDeadlines || null,
    destinations: pageProps.destinations || null,
    imprint: pageProps.imprint || null,
    currentPhase: pageProps.currentPhase || pageProps.page?.phase || null,
  });
  const site = sharedData.site || fallbackSiteData;
  const page = sharedData.page || {};
  const pageDeadlines = sharedData.pageDeadlines || {};
  const destinations = sharedData.destinations || [];
  const imprint = sharedData.imprint || {};
  const destinationsRef = useRef(destinations);
  const currentPhase = sharedData.currentPhase || page.phase || null;
  const currentPhaseLabel = getCurrentPhaseLabel(currentPhase)?.replaceAll(" ", "");
  const globeTextureUrl = getGlobeTextureUrl(page.globeTexture?.asset?.url);
  const textColorPalette = getTextColorPalette(page.textColors);
  const textColorPaletteKey = textColorPalette.join("|");
  const h1MarqueeText = getRouteMarqueeText(router.pathname, pageProps);
  const isDestinationsPage = router.pathname === "/destinations";
  const isContentAutoScrollPage = contentAutoScrollRoutes.has(router.pathname);
  const shouldFadeCityListOnScroll = isDestinationsPage || isContentAutoScrollPage;
  const is404Page = router.pathname === "/404";

  const [destinationCity, setDestinationCity] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [pendingDestinationSelection, setPendingDestinationSelection] = useState(null);
  const [highlightedCity, setHighlightedCity] = useState(null);
  const [contentScrollRequest, setContentScrollRequest] = useState(0);
  const [cityListScrollRequest, setCityListScrollRequest] = useState(0);
  const [isDestinationCityListHidden, setIsDestinationCityListHidden] = useState(false);
  const [shouldRenderCityList, setShouldRenderCityList] = useState(true);
  const globeMoverRef = useRef(null);
  const cityListLayerRef = useRef(null);
  const isDestinationCityListHiddenRef = useRef(false);
  const isCityListRouteRevealRef = useRef(false);
  const cityListRevealTimersRef = useRef([]);
  const destinationHeaderRevealRef = useRef({ frame: null, timeout: null });
  const hasInitializedMobileGlobePositionRef = useRef(false);
  const programmaticScrollLockRef = useRef(null);
  const footerRef = useRef(null);
  const imprintRef = useRef(null);
  const imprintCloseTimerRef = useRef(null);
  const imprintTouchStartYRef = useRef(null);
  const [globePosition, setGlobePosition] = useState({ x: 0, y: 0 });
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
  const [isApplicationFormEntered, setIsApplicationFormEntered] = useState(false);
  const [isApplicationFormDirty, setIsApplicationFormDirty] = useState(false);
  const [isImprintOpen, setIsImprintOpen] = useState(false);
  const [isImprintObscuring, setIsImprintObscuring] = useState(false);
  const [isContentContainerExiting, setIsContentContainerExiting] = useState(false);
  const [isPageTransitionSettled, setIsPageTransitionSettled] = useState(true);
  const [shouldScrollAboutToBottom, setShouldScrollAboutToBottom] = useState(false);
  const [h1MarqueeSpeedMultiplier, setH1MarqueeSpeedMultiplier] = useState(h1MarqueeDefaultSpeed);
  const pendingNavigationTimerRef = useRef(null);
  const h1MarqueeSettleTimerRef = useRef(null);
  const shouldScrollAboutToBottomRef = useRef(false);
  const globeSize = viewportWidth > 0 && viewportWidth < 769 ? viewportWidth * 0.5 : undefined;
  const isApplicationFormObscuring = isApplicationFormOpen && isApplicationFormEntered;
  const isPageObscuring = isApplicationFormObscuring || isImprintObscuring;

  const openApplicationForm = () => {
    setIsApplicationFormDirty(false);
    setIsApplicationFormEntered(false);
    setIsApplicationFormOpen(true);
  };

  const closeApplicationForm = () => {
    setIsApplicationFormEntered(false);
    setIsApplicationFormOpen(false);
    setIsApplicationFormDirty(false);
  };

  const confirmApplicationFormDiscard = () => {
    if (!isApplicationFormDirty) return true;

    return window.confirm("Your changes will be lost. Do you want to continue?");
  };

  const handleApplicationFormHomeClick = () => {
    if (!confirmApplicationFormDiscard()) return;

    closeApplicationForm();
    router.push("/").catch(() => {});
  };

  const stopProgrammaticScrollLock = () => {
    const lock = programmaticScrollLockRef.current;
    if (!lock) return;

    lock.cleanup();
    programmaticScrollLockRef.current = null;
  };

  const lockUserScrollUntil = (targetScrollTop, maxDuration = 1800) => {
    stopProgrammaticScrollLock();
    window.dispatchEvent(
      new CustomEvent(programmaticScrollLockEventName, {
        detail: { isLocked: true, targetScrollTop },
      }),
    );

    const preventUserScroll = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const preventUserScrollKey = (event) => {
      const scrollKeys = [" ", "ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp"];
      if (!scrollKeys.includes(event.key)) return;

      preventUserScroll(event);
    };
    let frameId = null;
    let timeoutId = null;
    let lastScrollY = window.scrollY;
    let stableFrames = 0;
    const startedAt = performance.now();

    const cleanup = () => {
      window.dispatchEvent(new CustomEvent(programmaticScrollLockEventName, { detail: { isLocked: false } }));
      window.removeEventListener("wheel", preventUserScroll, { capture: true });
      window.removeEventListener("touchmove", preventUserScroll, { capture: true });
      window.removeEventListener("keydown", preventUserScrollKey, { capture: true });

      if (frameId) cancelAnimationFrame(frameId);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const release = () => {
      if (programmaticScrollLockRef.current?.cleanup !== cleanup) return;

      cleanup();
      programmaticScrollLockRef.current = null;
    };

    const checkScrollLanding = () => {
      const currentScrollY = window.scrollY;
      const isAtTarget = Math.abs(currentScrollY - targetScrollTop) <= 2;
      const hasSettled = performance.now() - startedAt > 150 && Math.abs(currentScrollY - lastScrollY) < 0.25;

      stableFrames = hasSettled ? stableFrames + 1 : 0;

      if (isAtTarget || stableFrames >= 6) {
        release();
        return;
      }

      lastScrollY = currentScrollY;
      frameId = requestAnimationFrame(checkScrollLanding);
    };

    window.addEventListener("wheel", preventUserScroll, { capture: true, passive: false });
    window.addEventListener("touchmove", preventUserScroll, { capture: true, passive: false });
    window.addEventListener("keydown", preventUserScrollKey, { capture: true, passive: false });

    timeoutId = setTimeout(release, maxDuration);
    frameId = requestAnimationFrame(checkScrollLanding);
    programmaticScrollLockRef.current = { cleanup };
  };

  const scrollWindowTo = ({ top, behavior = "smooth", lock = behavior === "smooth" }) => {
    const maxScrollTop =
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight,
        document.body.offsetHeight,
      ) - window.innerHeight;
    const targetScrollTop = Math.max(Math.min(top, Math.max(maxScrollTop, 0)), 0);

    if (lock) {
      lockUserScrollUntil(targetScrollTop);
    } else {
      stopProgrammaticScrollLock();
    }

    if (!lock) {
      window.scrollTo({ top: targetScrollTop, behavior });
    }

    return targetScrollTop;
  };

  const scrollToElement = (element, offset = 49) => {
    if (!element) return null;

    const scrollTop = element.getBoundingClientRect().top + window.scrollY - offset;
    return scrollWindowTo({ top: scrollTop });
  };

  const scrollToElementBottom = (element, offset = 0) => {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const scrollTop = rect.bottom + window.scrollY - window.innerHeight + offset;
    return scrollWindowTo({ top: scrollTop });
  };

  const isCityListVisibleInViewport = () => {
    const cityListLayer = cityListLayerRef.current;
    if (!cityListLayer || isDestinationCityListHiddenRef.current) return false;

    const rect = cityListLayer.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const scrollToPageTop = (behavior = "smooth") => {
    scrollWindowTo({ top: 0, behavior, lock: behavior === "smooth" });

    if (behavior === "auto") {
      stopProgrammaticScrollLock();
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let animationFrame = null;
      const timeout = window.setTimeout(() => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        scrollToPageTop("auto").then(resolve);
      }, navigationScrollToTopFallbackMs);

      const checkScrollPosition = () => {
        if (window.scrollY <= 1) {
          window.clearTimeout(timeout);
          scrollToPageTop("auto").then(resolve);
          return;
        }

        animationFrame = requestAnimationFrame(checkScrollPosition);
      };

      animationFrame = requestAnimationFrame(checkScrollPosition);
    });
  };

  const openImprint = () => {
    if (imprintCloseTimerRef.current) {
      window.clearTimeout(imprintCloseTimerRef.current);
      imprintCloseTimerRef.current = null;
    }

    setIsImprintObscuring(true);
    setIsImprintOpen(true);
  };

  const closeImprint = () => {
    if (imprintCloseTimerRef.current) {
      window.clearTimeout(imprintCloseTimerRef.current);
    }

    setIsImprintObscuring(false);
    scrollToElementBottom(footerRef.current, getRootCssPixelValue("--margin"));
    imprintCloseTimerRef.current = window.setTimeout(() => {
      setIsImprintOpen(false);
      imprintCloseTimerRef.current = null;
    }, 450);
  };

  useEffect(() => {
    destinationsRef.current = destinations;
  }, [destinations]);

  useEffect(() => {
    return () => stopProgrammaticScrollLock();
  }, []);

  useEffect(() => {
    isDestinationCityListHiddenRef.current = isDestinationCityListHidden;
  }, [isDestinationCityListHidden]);

  useEffect(() => {
    shouldScrollAboutToBottomRef.current = shouldScrollAboutToBottom;
  }, [shouldScrollAboutToBottom]);

  useEffect(() => {
    const handleAboutBottomScrollRequest = () => {
      shouldScrollAboutToBottomRef.current = true;
      setShouldScrollAboutToBottom(true);
    };

    window.addEventListener(aboutBottomScrollRequestEventName, handleAboutBottomScrollRequest);

    return () => window.removeEventListener(aboutBottomScrollRequestEventName, handleAboutBottomScrollRequest);
  }, []);

  const clearCityListRevealTimers = () => {
    cityListRevealTimersRef.current.forEach(({ id, type }) => {
      if (type === "frame") {
        cancelAnimationFrame(id);
        return;
      }

      clearTimeout(id);
    });
    cityListRevealTimersRef.current = [];
  };

  const queueCityListReveal = () => {
    clearCityListRevealTimers();
    isCityListRouteRevealRef.current = true;
    setIsDestinationCityListHidden(false);
    setShouldRenderCityList(false);

    const queueFrame = (callback) => {
      const id = requestAnimationFrame(callback);
      cityListRevealTimersRef.current.push({ id, type: "frame" });
    };

    const queueTimeout = (callback, delay) => {
      const id = setTimeout(callback, delay);
      cityListRevealTimersRef.current.push({ id, type: "timeout" });
    };

    queueFrame(() =>
      queueFrame(() => {
        setIsDestinationCityListHidden(false);
        setShouldRenderCityList(true);
      }),
    );
    queueTimeout(() => setIsDestinationCityListHidden(false), 120);
    queueTimeout(() => {
      setIsDestinationCityListHidden(false);
      setShouldRenderCityList(true);
      isCityListRouteRevealRef.current = false;
      clearCityListRevealTimers();
    }, 360);
  };

  useEffect(() => {
    if (!isApplicationFormOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeApplicationForm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isApplicationFormOpen]);

  useEffect(() => {
    if (!isApplicationFormOpen || !isApplicationFormDirty) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isApplicationFormDirty, isApplicationFormOpen]);

  useEffect(() => {
    if (!isImprintOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeImprint();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isImprintOpen]);

  useEffect(() => {
    if (isApplicationFormOpen) return;

    setIsApplicationFormEntered(false);
  }, [isApplicationFormOpen]);

  useEffect(() => {
    if (isImprintOpen) return;

    setIsImprintObscuring(false);
  }, [isImprintOpen]);

  useEffect(() => {
    if (!isImprintOpen) return undefined;

    const scrollToImprintContainerBottom = () => {
      scrollToElementBottom(document.getElementById(contentContainerId) || imprintRef.current);
    };

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToImprintContainerBottom);
    });
    const timeoutId = window.setTimeout(scrollToImprintContainerBottom, 180);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [isImprintOpen]);

  useEffect(() => {
    if (!isImprintOpen) return undefined;

    const handleWheel = (event) => {
      if (event.deltaY >= 0) return;

      event.preventDefault();
      event.stopPropagation();
      closeImprint();
    };

    const handleTouchStart = (event) => {
      imprintTouchStartYRef.current = event.touches?.[0]?.clientY ?? null;
    };

    const handleTouchMove = (event) => {
      const startY = imprintTouchStartYRef.current;
      const currentY = event.touches?.[0]?.clientY;
      if (startY === null || currentY === undefined || currentY - startY < 8) return;

      event.preventDefault();
      event.stopPropagation();
      closeImprint();
    };

    window.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    window.addEventListener("touchstart", handleTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", handleTouchMove, { capture: true, passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove, { capture: true });
      imprintTouchStartYRef.current = null;
    };
  }, [isImprintOpen]);

  useEffect(() => {
    if (textColorPalette.length === 0) {
      document.documentElement.style.removeProperty("--selection-color");
      document.documentElement.style.removeProperty("--interactive-hover-color");
      return undefined;
    }

    let hasActiveSelectionColor = false;

    const getRandomHoverElement = (eventTarget) => {
      const stableHoverElement = eventTarget.closest?.("[data-random-hover-color]");

      return stableHoverElement || eventTarget.closest?.("a, button, [role='button']");
    };

    const clearRandomHoverColor = (element) => {
      element.style.removeProperty("--interactive-hover-color");
    };

    const setRandomHoverColor = (element) => {
      if (element.style.getPropertyValue("--interactive-hover-color")) return;

      const nextColor = getRandomTextColor(textColorPalette);
      if (!nextColor) return;

      element.style.setProperty("--interactive-hover-color", nextColor);
    };

    const handlePointerOver = (event) => {
      const interactiveElement = getRandomHoverElement(event.target);
      const previousElement = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (!interactiveElement || (previousElement && interactiveElement.contains(previousElement))) return;

      setRandomHoverColor(interactiveElement);
    };

    const handlePointerOut = (event) => {
      const interactiveElement = getRandomHoverElement(event.target);
      const nextElement = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (!interactiveElement || (nextElement && interactiveElement.contains(nextElement))) return;

      clearRandomHoverColor(interactiveElement);
    };

    const handleFocusIn = (event) => {
      const interactiveElement = getRandomHoverElement(event.target);
      if (!interactiveElement) return;

      setRandomHoverColor(interactiveElement);
    };

    const handleSelectionChange = () => {
      const selectionText = window.getSelection()?.toString() || "";

      if (!selectionText.trim()) {
        hasActiveSelectionColor = false;
        return;
      }

      if (hasActiveSelectionColor) return;

      const nextColor = getRandomTextColor(textColorPalette);
      if (!nextColor) return;

      hasActiveSelectionColor = true;
      document.documentElement.style.setProperty("--selection-color", nextColor);
    };

    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [textColorPaletteKey]);

  const moveGlobeForNavigation = (nextHref = "") => {
    const nextPathname = nextHref ? new URL(nextHref, window.location.href).pathname : "";
    const shouldRouteSelectRandomCity = nextPathname !== "/destinations";
    const randomDestination = shouldRouteSelectRandomCity ? getRandomDestination(destinationsRef.current) : null;

    if (randomDestination) {
      setDestinationCity(randomDestination);
    }

    if (window.innerWidth >= 769) {
      setGlobePosition((currentPosition) => getRandomDesktopGlobePosition(currentPosition));
    } else {
      setGlobePosition((currentPosition) => getRandomMobileGlobePosition(currentPosition));
    }
  };

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    if (viewportWidth <= 0) return;

    if (viewportWidth >= 769) {
      hasInitializedMobileGlobePositionRef.current = false;
      return;
    }

    setGlobePosition((currentPosition) => {
      if (hasInitializedMobileGlobePositionRef.current) {
        return clampMobileGlobePosition(currentPosition);
      }

      hasInitializedMobileGlobePositionRef.current = true;
      return getRandomMobileGlobePosition(currentPosition);
    });
  }, [viewportWidth]);

  useEffect(() => {
    const isInsideGlobe = (event) => event.target?.closest?.("[data-globe-interaction-root]");
    const isBrowserZoomKey = (event) => {
      if (!event.metaKey && !event.ctrlKey) return false;

      return ["+", "=", "-", "_", "0"].includes(event.key);
    };

    const preventBrowserZoom = (event) => {
      if (isInsideGlobe(event)) return;

      event.preventDefault();
    };

    const handleKeyDown = (event) => {
      if (!isBrowserZoomKey(event)) return;

      event.preventDefault();
    };

    const handleWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;

      preventBrowserZoom(event);
    };

    const handleTouchMove = (event) => {
      if ((event.touches?.length || 0) < 2) return;

      preventBrowserZoom(event);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    window.addEventListener("gesturestart", preventBrowserZoom, { capture: true, passive: false });
    window.addEventListener("gesturechange", preventBrowserZoom, { capture: true, passive: false });
    window.addEventListener("touchmove", handleTouchMove, { capture: true, passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("gesturestart", preventBrowserZoom, { capture: true });
      window.removeEventListener("gesturechange", preventBrowserZoom, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove, { capture: true });
    };
  }, []);

  useEffect(() => {
    const clearH1MarqueeSettleTimer = () => {
      if (!h1MarqueeSettleTimerRef.current) return;

      clearTimeout(h1MarqueeSettleTimerRef.current);
      h1MarqueeSettleTimerRef.current = null;
    };

    const clearPendingNavigationTimer = () => {
      if (!pendingNavigationTimerRef.current) return;

      clearTimeout(pendingNavigationTimerRef.current);
      pendingNavigationTimerRef.current = null;
    };

    const getInternalNavigationHref = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return null;
      }

      const anchor = event.target.closest?.("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download") || anchor.dataset.manualNavigation) return null;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return null;
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return null;

      return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    };

    const handleDocumentClick = (event) => {
      const nextHref = getInternalNavigationHref(event);
      if (!nextHref) return;

      event.preventDefault();

      clearPendingNavigationTimer();
      clearH1MarqueeSettleTimer();
      setH1MarqueeSpeedMultiplier(h1MarqueeNavigationSpeed);
      const nextPathname = new URL(nextHref, window.location.href).pathname;
      const shouldPreserveScroll =
        nextPathname === "/destinations" || (nextPathname === "/about" && shouldScrollAboutToBottomRef.current);
      const shouldScrollToTop = !shouldPreserveScroll && isCityListVisibleInViewport();

      setIsContentContainerExiting(!shouldScrollToTop);
      setShouldRenderCityList(shouldScrollToTop);

      const waitForNavigation = shouldScrollToTop
        ? Promise.all([
            scrollToPageTop(),
            new Promise((resolve) => {
              pendingNavigationTimerRef.current = setTimeout(resolve, h1MarqueeScrollNavigationLeadInMs);
            }),
          ])
        : new Promise((resolve) => {
            pendingNavigationTimerRef.current = setTimeout(resolve, h1MarqueeNavigationLeadInMs);
          });

      if (shouldScrollToTop) {
        setIsDestinationCityListHidden(false);
      }

      waitForNavigation.then(() => {
        pendingNavigationTimerRef.current = null;
        if (shouldScrollToTop) {
          scrollToPageTop("auto");
        }
        router.push(nextHref, undefined, { scroll: !shouldPreserveScroll }).catch(() => {
          setH1MarqueeSpeedMultiplier(h1MarqueeDefaultSpeed);
        });
      });
    };

    const handleRouteChangeStart = (nextHref) => {
      clearH1MarqueeSettleTimer();
      setIsApplicationFormEntered(false);
      setIsApplicationFormOpen(false);
      setIsPageTransitionSettled(false);
      setH1MarqueeSpeedMultiplier(h1MarqueeNavigationSpeed);
      if (!pendingNavigationTimerRef.current) {
        const nextPathname = new URL(nextHref, window.location.href).pathname;
        const shouldPreserveScroll =
          nextPathname === "/destinations" || (nextPathname === "/about" && shouldScrollAboutToBottomRef.current);
        const shouldScrollToTop = !shouldPreserveScroll && isCityListVisibleInViewport();

        setIsContentContainerExiting(!shouldScrollToTop);
        setShouldRenderCityList(shouldScrollToTop);

        if (shouldScrollToTop) {
          setIsDestinationCityListHidden(false);
          scrollToPageTop();
        }
      }
      moveGlobeForNavigation(nextHref);
    };

    const settleH1MarqueeSpeed = () => {
      clearH1MarqueeSettleTimer();
      setIsContentContainerExiting(false);
      h1MarqueeSettleTimerRef.current = setTimeout(() => {
        setH1MarqueeSpeedMultiplier(h1MarqueeDefaultSpeed);
        h1MarqueeSettleTimerRef.current = null;
      }, h1MarqueeNavigationSettleDelay);
    };

    const handleRouteChangeComplete = () => {
      settleH1MarqueeSpeed();
      queueCityListReveal();
    };

    const handleRouteChangeError = () => {
      setIsPageTransitionSettled(true);
      settleH1MarqueeSpeed();
    };

    document.addEventListener("click", handleDocumentClick, true);
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      clearPendingNavigationTimer();
      clearH1MarqueeSettleTimer();
      clearCityListRevealTimers();
      document.removeEventListener("click", handleDocumentClick, true);
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router.events]);

  useEffect(() => {
    if (isAppReady || !router.isReady) return undefined;

    let isMounted = true;
    const hasInitialSharedData =
      sharedData.site && sharedData.page && sharedData.pageDeadlines && sharedData.destinations && sharedData.imprint;
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) setIsAppReady(true);
    }, 2500);

    if (!hasInitialSharedData && !is404Page) {
      return () => {
        isMounted = false;
        clearTimeout(fallbackTimeout);
      };
    }

    const waitForPageLoad =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    const waitForFonts = document.fonts?.ready || Promise.resolve();
    const waitForFrames = () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

    Promise.all([waitForPageLoad, waitForFonts])
      .then(waitForFrames)
      .then(() => {
        if (isMounted) {
          setIsAppReady(true);
          clearTimeout(fallbackTimeout);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
    };
  }, [
    is404Page,
    isAppReady,
    router.isReady,
    sharedData.destinations,
    sharedData.imprint,
    sharedData.page,
    sharedData.pageDeadlines,
    sharedData.site,
  ]);

  useEffect(() => {
    setSharedData((previousData) => ({
      site: pageProps.site || previousData.site,
      page: pageProps.page || previousData.page,
      pageDeadlines: pageProps.pageDeadlines || previousData.pageDeadlines,
      destinations: pageProps.destinations || previousData.destinations,
      imprint: pageProps.imprint || previousData.imprint,
      currentPhase: pageProps.currentPhase || pageProps.page?.phase || previousData.currentPhase,
    }));
  }, [
    pageProps.currentPhase,
    pageProps.destinations,
    pageProps.imprint,
    pageProps.page,
    pageProps.pageDeadlines,
    pageProps.site,
  ]);

  useEffect(() => {
    if (sharedData.site && sharedData.page && sharedData.pageDeadlines && sharedData.destinations && sharedData.imprint) {
      return undefined;
    }

    let isMounted = true;

    async function fetchSharedData() {
      const response = await fetch("/api/shared-chrome");
      if (!response.ok) return;

      const nextSharedData = await response.json();

      if (isMounted) {
        setSharedData((previousData) => ({
          site: previousData.site || nextSharedData.site,
          page: previousData.page || nextSharedData.page,
          pageDeadlines: previousData.pageDeadlines || nextSharedData.pageDeadlines,
          destinations: previousData.destinations || nextSharedData.destinations,
          imprint: previousData.imprint || nextSharedData.imprint,
          currentPhase: previousData.currentPhase || nextSharedData.currentPhase,
        }));
      }
    }

    fetchSharedData();

    return () => {
      isMounted = false;
    };
  }, [sharedData.destinations, sharedData.imprint, sharedData.page, sharedData.pageDeadlines, sharedData.site]);

  const clearDestinationHeaderReveal = () => {
    const { frame, timeout } = destinationHeaderRevealRef.current;

    if (frame) {
      cancelAnimationFrame(frame);
    }

    if (timeout) {
      clearTimeout(timeout);
    }

    destinationHeaderRevealRef.current = { frame: null, timeout: null };
  };

  const showHeaderAfterDestinationScroll = (targetScrollTop) => {
    clearDestinationHeaderReveal();

    const startScrollY = window.scrollY;
    const startTime = performance.now();
    let lastScrollY = startScrollY;
    let hasMoved = Math.abs(startScrollY - targetScrollTop) <= 2;
    let stableFrames = 0;

    const showHeader = () => {
      clearDestinationHeaderReveal();
      window.dispatchEvent(new CustomEvent(showHeaderEventName));
    };

    destinationHeaderRevealRef.current.timeout = setTimeout(showHeader, 1400);

    const checkScroll = () => {
      const currentScrollY = window.scrollY;
      const elapsed = performance.now() - startTime;
      const isAtTarget = Math.abs(currentScrollY - targetScrollTop) <= 2;

      hasMoved = hasMoved || Math.abs(currentScrollY - startScrollY) > 2;
      stableFrames = hasMoved && elapsed > 150 && Math.abs(currentScrollY - lastScrollY) < 0.25 ? stableFrames + 1 : 0;

      if (isAtTarget || stableFrames >= 6) {
        showHeader();
        return;
      }

      lastScrollY = currentScrollY;
      destinationHeaderRevealRef.current.frame = requestAnimationFrame(checkScroll);
    };

    destinationHeaderRevealRef.current.frame = requestAnimationFrame(checkScroll);
  };

  const scrollToContent = () => {
    const contentElement = document.getElementById(contentContainerId);
    if (!contentElement) return;

    // HERE
    const scrollTop = contentElement.getBoundingClientRect().top + window.scrollY - 49;
    const targetScrollTop = Math.max(scrollTop, 0);

    const finalTargetScrollTop = scrollWindowTo({ top: targetScrollTop });
    showHeaderAfterDestinationScroll(finalTargetScrollTop);
  };

  const handleCityClick = (city) => {
    setHighlightedCity(null);
    setDestinationCity(city);

    if (!isDestinationsPage) {
      setPendingDestinationSelection(city);
      setIsDestinationCityListHidden(false);

      setH1MarqueeSpeedMultiplier(h1MarqueeNavigationSpeed);
      setIsContentContainerExiting(false);
      setShouldRenderCityList(true);

      Promise.all([
        scrollToPageTop(),
        new Promise((resolve) => {
          pendingNavigationTimerRef.current = setTimeout(resolve, h1MarqueeScrollNavigationLeadInMs);
        }),
      ]).then(() => {
        pendingNavigationTimerRef.current = null;
        scrollToPageTop("auto");
        router.push("/destinations").catch(() => {
          setH1MarqueeSpeedMultiplier(h1MarqueeDefaultSpeed);
        });
      });
      return;
    }

    setSelectedDestination(city);
    setContentScrollRequest((requestCount) => requestCount + 1);
  };

  const handleCityMarkerClick = (city) => {
    setDestinationCity(city);
    setHighlightedCity(city);
    setCityListScrollRequest((requestCount) => requestCount + 1);

    if (isDestinationsPage) {
      setSelectedDestination(city);
    }
  };

  useEffect(() => {
    if (!isDestinationsPage) {
      setSelectedDestination(null);
      setIsDestinationCityListHidden(false);
      setContentScrollRequest(0);
    }
  }, [isDestinationsPage]);

  useEffect(() => {
    if (!isDestinationsPage || !pendingDestinationSelection) return;

    setHighlightedCity(null);
    setDestinationCity(pendingDestinationSelection);
    setSelectedDestination(pendingDestinationSelection);
    setContentScrollRequest((requestCount) => requestCount + 1);
    setPendingDestinationSelection(null);
  }, [isDestinationsPage, pendingDestinationSelection]);

  useEffect(() => {
    if (!shouldFadeCityListOnScroll) {
      setIsDestinationCityListHidden(false);
      return undefined;
    }

    const cityListLayer = cityListLayerRef.current;
    if (!cityListLayer) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isCityListRouteRevealRef.current) return;

        setIsDestinationCityListHidden(entry.intersectionRatio < 0.1);
      },
      { threshold: [0, 0.1, 1] },
    );

    observer.observe(cityListLayer);

    return () => observer.disconnect();
  }, [shouldFadeCityListOnScroll]);

  useEffect(() => {
    if (!is404Page) {
      delete document.documentElement.dataset.route;

      return () => {
        delete document.documentElement.dataset.route;
      };
    }

    document.documentElement.dataset.route = "not-found";

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      delete document.documentElement.dataset.route;
    };
  }, [is404Page]);

  useEffect(() => {
    if (!isDestinationsPage || pendingDestinationSelection || selectedDestination || destinations.length === 0) return;

    const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];
    setDestinationCity(randomDestination);
    setSelectedDestination(randomDestination);
  }, [destinations, isDestinationsPage, pendingDestinationSelection, selectedDestination]);

  useEffect(() => {
    if (!isDestinationsPage || !isPageTransitionSettled || !selectedDestination || contentScrollRequest === 0)
      return undefined;

    const frameIds = [];
    const timeoutIds = [];
    const queueFrame = (callback) => {
      const id = requestAnimationFrame(callback);
      frameIds.push(id);
    };
    const queueTimeout = (callback, delay) => {
      const id = setTimeout(callback, delay);
      timeoutIds.push(id);
    };

    queueFrame(() => queueFrame(scrollToContent));
    queueTimeout(scrollToContent, 120);
    queueTimeout(scrollToContent, 360);

    return () => {
      frameIds.forEach(cancelAnimationFrame);
      timeoutIds.forEach(clearTimeout);
    };
  }, [contentScrollRequest, isDestinationsPage, isPageTransitionSettled, selectedDestination]);

  useEffect(() => {
    if (
      !isContentAutoScrollPage ||
      !isPageTransitionSettled ||
      (router.pathname === "/about" && shouldScrollAboutToBottomRef.current)
    )
      return undefined;

    const frameIds = [];
    const timeoutIds = [];
    const queueFrame = (callback) => {
      const id = requestAnimationFrame(callback);
      frameIds.push(id);
    };
    const queueTimeout = (callback, delay) => {
      const id = setTimeout(callback, delay);
      timeoutIds.push(id);
    };

    queueFrame(() => queueFrame(scrollToContent));
    queueTimeout(scrollToContent, 120);
    queueTimeout(scrollToContent, 360);

    return () => {
      frameIds.forEach(cancelAnimationFrame);
      timeoutIds.forEach(clearTimeout);
    };
  }, [isContentAutoScrollPage, isPageTransitionSettled, router.asPath, router.pathname]);

  useEffect(() => {
    if (!shouldScrollAboutToBottom || router.pathname !== "/about" || !isPageTransitionSettled) return undefined;

    const scrollToAboutTeam = () => {
      scrollToElement(document.getElementById("about-team"));
    };
    const frameId = requestAnimationFrame(() => requestAnimationFrame(scrollToAboutTeam));
    const timeoutId = setTimeout(() => {
      shouldScrollAboutToBottomRef.current = false;
      setShouldScrollAboutToBottom(false);
    }, 900);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [isPageTransitionSettled, router.pathname, shouldScrollAboutToBottom]);

  useEffect(() => {
    if (!highlightedCity?._id || cityListScrollRequest === 0) return undefined;

    const scrollToHighlightedCity = () => {
      document.getElementById(`city-${highlightedCity._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const frameId = requestAnimationFrame(scrollToHighlightedCity);
    const timeoutId = setTimeout(scrollToHighlightedCity, 180);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [cityListScrollRequest, highlightedCity]);

  return (
    <>
      <Head>
        <title>{site.title}</title>
        {site.description ? <meta name="description" content={site.description} /> : null}
        <meta property="og:title" content={site.title} />
        {site.description ? <meta property="og:description" content={site.description} /> : null}
        <meta property="og:type" content="website" />
        {site.shareImageUrl ? <meta property="og:image" content={site.shareImageUrl} /> : null}
        {site.shareImageUrl ? <meta name="twitter:card" content="summary_large_image" /> : null}
        {site.shareImageUrl ? <meta name="twitter:image" content={site.shareImageUrl} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="icon" href={site.faviconUrl} />
      </Head>

      <div className={[styles.appShell, isAppReady ? styles.appShellReady : ""].filter(Boolean).join(" ")}>
        <ViewportProvider>
          <DeviceProvider>
            <LenisProvider>
              <Header currentPhase={currentPhase} pageDeadlines={pageDeadlines} site={site} />
              <div className={[styles.sharedLayer, isPageObscuring ? styles.pageObscured : ""].filter(Boolean).join(" ")}>
                <motion.div
                  animate={globePosition}
                  className={styles.globeMover}
                  ref={globeMoverRef}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Globe
                    cities={destinations}
                    destinationCity={destinationCity}
                    globeImageUrl={globeTextureUrl}
                    height={globeSize}
                    onCityMarkerClick={handleCityMarkerClick}
                    width={globeSize}
                  />
                </motion.div>

                <div className={styles.marqueeContainer}>
                  {h1MarqueeText ? (
                    <Marquee
                      direction="backward"
                      speedMultiplier={h1MarqueeSpeedMultiplier}
                      speedTransitionMs={h1MarqueeNavigationSpeedTransitionMs}
                      text={h1MarqueeText}
                      typo="h1"
                    />
                  ) : null}
                  {page.marqueeText ? <Marquee text={page.marqueeText} className={styles.smallMarquee} /> : null}
                </div>
              </div>
              <div
                className={[
                  styles.cityListLayer,
                  isPageObscuring ? styles.pageObscured : "",
                  isDestinationCityListHidden ? styles.cityListLayerHidden : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                ref={cityListLayerRef}
              >
                <AnimatePresence initial={false}>
                  {shouldRenderCityList ? (
                    <motion.div
                      animate="animate"
                      exit="exit"
                      initial="initial"
                      key="city-list"
                      transition={cityListTransition}
                      variants={cityListTransitionVariants}
                    >
                      <CityList
                        accentInactive={isDestinationsPage}
                        cities={destinations}
                        highlightedCity={highlightedCity}
                        isClickable
                        onCityClick={handleCityClick}
                        onCitySelect={setDestinationCity}
                        selectedCity={isDestinationsPage ? selectedDestination : null}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              {isApplicationFormOpen || isImprintObscuring ? null : <SpacingDebugOverlay />}
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate="animate"
                  className={["pageTransition", isApplicationFormObscuring ? styles.pageObscured : ""]
                    .filter(Boolean)
                    .join(" ")}
                  exit="exit"
                  initial="initial"
                  key={router.asPath}
                  onAnimationComplete={(definition) => {
                    if (definition === "animate") {
                      setIsPageTransitionSettled(true);
                      window.dispatchEvent(
                        new CustomEvent(pageTransitionCompleteEventName, { detail: { path: router.asPath } }),
                      );
                    }
                  }}
                  transition={pageTransition}
                  variants={pageTransitionVariants}
                >
                  {is404Page ? (
                    <Component {...pageProps} />
                  ) : (
                    <ContentContainer
                      className={isContentContainerExiting ? styles.contentContainerExiting : ""}
                      id={contentContainerId}
                    >
                      <div className={isImprintObscuring ? styles.pageObscured : ""}>
                        <div className="pageTransitionRoot">
                          <Component {...pageProps} selectedDestination={selectedDestination} />
                        </div>
                        <div ref={footerRef}>
                          <Footer onApplyClick={openApplicationForm} onImprintClick={openImprint} page={page} site={site} />
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {isImprintOpen ? (
                          <motion.div
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            initial={{ opacity: 0 }}
                            ref={imprintRef}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                          >
                            <Imprint imprint={imprint} onClose={closeImprint} />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </ContentContainer>
                  )}
                </motion.div>
              </AnimatePresence>
              <ApplicationFormOverlay
                currentPhaseLabel={getCurrentPhaseLabel(currentPhase)}
                destinations={destinations}
                isOpen={isApplicationFormOpen}
                onClose={closeApplicationForm}
                onDirtyChange={setIsApplicationFormDirty}
                onHomeClick={handleApplicationFormHomeClick}
                onOpenComplete={() => setIsApplicationFormEntered(true)}
                page={page}
                pageDeadlines={pageDeadlines}
              />
            </LenisProvider>
          </DeviceProvider>
        </ViewportProvider>
      </div>
    </>
  );
}
