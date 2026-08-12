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

const H1_MARQUEE_STOP_DURATION = 0.45;
const pageTransition = { duration: 0.5, ease: "easeInOut" };

const pageTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    pointerEvents: "none",
    transition: { ...pageTransition, delay: H1_MARQUEE_STOP_DURATION },
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
  const currentPhase = sharedData.currentPhase || page.phase || null;
  const currentPhaseLabel = getCurrentPhaseLabel(currentPhase)?.replaceAll(" ", "");
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
  const [h1MarqueeTargetSpeed, setH1MarqueeTargetSpeed] = useState(1);
  const [displayedH1MarqueeText, setDisplayedH1MarqueeText] = useState(h1MarqueeText);
  const [isH1MarqueeVisible, setIsH1MarqueeVisible] = useState(Boolean(h1MarqueeText));
  const h1MarqueeTextRef = useRef(h1MarqueeText);
  const h1MarqueeTextUpdateTimeoutRef = useRef(null);
  const isH1MarqueeTransitioningRef = useRef(false);
  const globeSize = viewportWidth > 0 && viewportWidth < 769 ? viewportWidth * 0.5 : undefined;

  useEffect(() => {
    h1MarqueeTextRef.current = h1MarqueeText;

    if (isH1MarqueeTransitioningRef.current) return;

    setDisplayedH1MarqueeText(h1MarqueeText);
    setIsH1MarqueeVisible(Boolean(h1MarqueeText));
  }, [h1MarqueeText]);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      clearTimeout(h1MarqueeTextUpdateTimeoutRef.current);
      isH1MarqueeTransitioningRef.current = true;
      setH1MarqueeTargetSpeed(0);
      setIsH1MarqueeVisible(false);
    };

    const handleRouteChangeEnd = () => {
      clearTimeout(h1MarqueeTextUpdateTimeoutRef.current);
      h1MarqueeTextUpdateTimeoutRef.current = setTimeout(() => {
        const nextH1MarqueeText = h1MarqueeTextRef.current;

        setDisplayedH1MarqueeText(nextH1MarqueeText);
        setIsH1MarqueeVisible(Boolean(nextH1MarqueeText));
        setH1MarqueeTargetSpeed(1);
        isH1MarqueeTransitioningRef.current = false;
      }, H1_MARQUEE_STOP_DURATION * 1000);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeEnd);
    router.events.on("routeChangeError", handleRouteChangeEnd);

    return () => {
      clearTimeout(h1MarqueeTextUpdateTimeoutRef.current);
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeEnd);
      router.events.off("routeChangeError", handleRouteChangeEnd);
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
    document.getElementById(contentContainerId)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      setDestinationCity(null);
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
                    height={globeSize}
                    onCityMarkerClick={handleCityMarkerClick}
                    width={globeSize}
                  />
                </motion.div>

                <div className={styles.marqueeContainer}>
                  <AnimatePresence initial={false} mode="wait">
                    {isH1MarqueeVisible && displayedH1MarqueeText ? (
                      <motion.div
                        animate="animate"
                        exit="exit"
                        initial="initial"
                        key={`h1-${displayedH1MarqueeText}`}
                        transition={pageTransition}
                        variants={sharedTransitionVariants}
                      >
                        <Marquee
                          direction="backward"
                          targetSpeed={h1MarqueeTargetSpeed}
                          text={displayedH1MarqueeText}
                          typo="h1"
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
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
