import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import CityList from "@/components/CityList/CityList";
import ContentContainer from "@/components/ContentContainer/ContentContainer";
import Footer from "@/components/Footer/Footer";
import Globe from "@/components/Globe/Globe";
import { DeviceProvider } from "@/context/DeviceContext";
import LenisProvider from "@/context/LenisContext";
import Marquee from "@/components/Marquee/Marquee";
import { ViewportProvider } from "@/context/ViewportContext";
import Header from "@/components/Header/Header";
import SpacingDebugOverlay from "@/components/SpacingDebugOverlay/SpacingDebugOverlay";

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

// Updated Packages

const sharedTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const routeMarqueeLabels = {
  "/destinations": "Destinations",
  "/jury": "JuryIntl.",
  "/open-call": "OpenCall",
  "/about": "About",
  "/404": "404NotFound",
};
const contentContainerId = "page-content";
const desktopGlobeSize = 300;
const desktopGlobeBasePosition = { x: 200, y: 200 };
const desktopGlobeViewportPadding = 24;
const desktopGlobeMinimumNavigationDistance = 300;
const desktopGlobePositionAttempts = 24;
const mobileGlobeViewportPadding = 16;
const mobileGlobeMinimumNavigationDistance = 180;
const h1MarqueeDefaultSpeed = 1;
const h1MarqueeNavigationSpeed = 100;
const h1MarqueeNavigationLeadInMs = 350;
const h1MarqueeNavigationSettleDelay = 0;
const h1MarqueeNavigationSpeedTransitionMs = 1000;
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
  const minLeft = mobileGlobeViewportPadding;
  const maxLeft = Math.max(window.innerWidth / 2 - mobileGlobeSize - mobileGlobeViewportPadding, minLeft);
  const minTop = mobileGlobeViewportPadding;
  const maxTop = Math.max(window.innerHeight - mobileGlobeSize - mobileGlobeViewportPadding, minTop);
  const left = getRandomNumber(minLeft, maxLeft);
  const top = getRandomNumber(minTop, maxTop);

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

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [sharedData, setSharedData] = useState({
    site: pageProps.site || null,
    page: pageProps.page || null,
    pageDeadlines: pageProps.pageDeadlines || null,
    destinations: pageProps.destinations || null,
    currentPhase: pageProps.currentPhase || pageProps.page?.phase || null,
  });
  const site = sharedData.site || fallbackSiteData;
  const page = sharedData.page || {};
  const pageDeadlines = sharedData.pageDeadlines || {};
  const destinations = sharedData.destinations || [];
  const destinationsRef = useRef(destinations);
  const currentPhase = sharedData.currentPhase || page.phase || null;
  const currentPhaseLabel = getCurrentPhaseLabel(currentPhase)?.replaceAll(" ", "");
  const globeTextureUrl = getGlobeTextureUrl(page.globeTexture?.asset?.url);
  const textColorPalette = getTextColorPalette(page.textColors);
  const textColorPaletteKey = textColorPalette.join("|");
  const h1MarqueeText = routeMarqueeLabels[router.pathname] || currentPhaseLabel;
  const isDestinationsPage = router.pathname === "/destinations";
  const is404Page = router.pathname === "/404";

  const [destinationCity, setDestinationCity] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [highlightedCity, setHighlightedCity] = useState(null);
  const [contentScrollRequest, setContentScrollRequest] = useState(0);
  const [cityListScrollRequest, setCityListScrollRequest] = useState(0);
  const globeMoverRef = useRef(null);
  const [globePosition, setGlobePosition] = useState({ x: 0, y: 0 });
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isAppReady, setIsAppReady] = useState(false);
  const [h1MarqueeSpeedMultiplier, setH1MarqueeSpeedMultiplier] = useState(h1MarqueeDefaultSpeed);
  const pendingNavigationTimerRef = useRef(null);
  const h1MarqueeSettleTimerRef = useRef(null);
  const globeSize = viewportWidth > 0 && viewportWidth < 769 ? viewportWidth * 0.5 : undefined;

  useEffect(() => {
    destinationsRef.current = destinations;
  }, [destinations]);

  useEffect(() => {
    if (textColorPalette.length === 0) {
      document.documentElement.style.removeProperty("--selection-color");
      document.documentElement.style.removeProperty("--interactive-hover-color");
      return undefined;
    }

    let hasActiveSelectionColor = false;

    const setRandomHoverColor = (element) => {
      const nextColor = getRandomTextColor(textColorPalette);
      if (!nextColor) return;

      element.style.setProperty("--interactive-hover-color", nextColor);
    };

    const handlePointerOver = (event) => {
      const interactiveElement = event.target.closest?.("a, button, [role='button'], [data-random-hover-color]");
      const previousElement = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (!interactiveElement || (previousElement && interactiveElement.contains(previousElement))) return;

      setRandomHoverColor(interactiveElement);
    };

    const handleFocusIn = (event) => {
      const interactiveElement = event.target.closest?.("a, button, [role='button'], [data-random-hover-color]");
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
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [textColorPaletteKey]);

  const moveGlobeForNavigation = () => {
    const randomDestination = getRandomDestination(destinationsRef.current);

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
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return null;

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

      pendingNavigationTimerRef.current = setTimeout(() => {
        pendingNavigationTimerRef.current = null;
        router.push(nextHref).catch(() => {
          setH1MarqueeSpeedMultiplier(h1MarqueeDefaultSpeed);
        });
      }, h1MarqueeNavigationLeadInMs);
    };

    const handleRouteChangeStart = () => {
      clearH1MarqueeSettleTimer();
      setH1MarqueeSpeedMultiplier(h1MarqueeNavigationSpeed);
      moveGlobeForNavigation();
    };

    const settleH1MarqueeSpeed = () => {
      clearH1MarqueeSettleTimer();
      h1MarqueeSettleTimerRef.current = setTimeout(() => {
        setH1MarqueeSpeedMultiplier(h1MarqueeDefaultSpeed);
        h1MarqueeSettleTimerRef.current = null;
      }, h1MarqueeNavigationSettleDelay);
    };

    document.addEventListener("click", handleDocumentClick, true);
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", settleH1MarqueeSpeed);
    router.events.on("routeChangeError", settleH1MarqueeSpeed);

    return () => {
      clearPendingNavigationTimer();
      clearH1MarqueeSettleTimer();
      document.removeEventListener("click", handleDocumentClick, true);
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", settleH1MarqueeSpeed);
      router.events.off("routeChangeError", settleH1MarqueeSpeed);
    };
  }, [router.events]);

  useEffect(() => {
    if (isAppReady || !router.isReady) return undefined;

    let isMounted = true;
    const hasInitialSharedData = sharedData.site && sharedData.page && sharedData.pageDeadlines && sharedData.destinations;
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
      currentPhase: pageProps.currentPhase || pageProps.page?.phase || previousData.currentPhase,
    }));
  }, [pageProps.currentPhase, pageProps.destinations, pageProps.page, pageProps.pageDeadlines, pageProps.site]);

  useEffect(() => {
    if (sharedData.site && sharedData.page && sharedData.pageDeadlines && sharedData.destinations) return undefined;

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
          currentPhase: previousData.currentPhase || nextSharedData.currentPhase,
        }));
      }
    }

    fetchSharedData();

    return () => {
      isMounted = false;
    };
  }, [sharedData.destinations, sharedData.page, sharedData.pageDeadlines, sharedData.site]);

  const scrollToContent = () => {
    const contentElement = document.getElementById(contentContainerId);
    if (!contentElement) return;

    const scrollTop = contentElement.getBoundingClientRect().top + window.scrollY - 65;

    window.scrollTo({ top: Math.max(scrollTop, 0), behavior: "smooth" });
  };

  const handleCityClick = (city) => {
    setHighlightedCity(null);
    setDestinationCity(city);

    if (!isDestinationsPage) return;

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
    }
  }, [isDestinationsPage]);

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
    if (!isDestinationsPage || selectedDestination || destinations.length === 0) return;

    const randomDestination = destinations[Math.floor(Math.random() * destinations.length)];
    setDestinationCity(randomDestination);
    setSelectedDestination(randomDestination);
  }, [destinations, isDestinationsPage, selectedDestination]);

  useEffect(() => {
    if (!isDestinationsPage || !selectedDestination || contentScrollRequest === 0) return undefined;

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
  }, [contentScrollRequest, isDestinationsPage, selectedDestination]);

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={site.faviconUrl} />
      </Head>

      <div className={[styles.appShell, isAppReady ? styles.appShellReady : ""].filter(Boolean).join(" ")}>
        <ViewportProvider>
          <DeviceProvider>
            <LenisProvider>
              <Header currentPhase={currentPhase} pageDeadlines={pageDeadlines} site={site} />
              <div className={styles.sharedLayer}>
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
                  {page.marqueeText ? <Marquee text={page.marqueeText} typo="h4" /> : null}
                </div>
              </div>
              <div className={styles.cityListLayer}>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    animate="animate"
                    exit="exit"
                    initial="initial"
                    key={`city-list-${router.asPath}`}
                    transition={pageTransition}
                    variants={sharedTransitionVariants}
                  >
                    <CityList
                      accentInactive={isDestinationsPage}
                      cities={destinations}
                      highlightedCity={highlightedCity}
                      isClickable={isDestinationsPage}
                      onCityClick={isDestinationsPage ? handleCityClick : undefined}
                      onCitySelect={setDestinationCity}
                      selectedCity={isDestinationsPage ? selectedDestination : null}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <SpacingDebugOverlay />
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate="animate"
                  className="pageTransition"
                  exit="exit"
                  initial="initial"
                  key={router.asPath}
                  transition={pageTransition}
                  variants={pageTransitionVariants}
                >
                  {is404Page ? (
                    <Component {...pageProps} />
                  ) : (
                    <ContentContainer id={contentContainerId}>
                      <div className="pageTransitionRoot">
                        <Component {...pageProps} selectedDestination={selectedDestination} />
                      </div>
                      <Footer page={page} site={site} />
                    </ContentContainer>
                  )}
                </motion.div>
              </AnimatePresence>
            </LenisProvider>
          </DeviceProvider>
        </ViewportProvider>
      </div>
    </>
  );
}
