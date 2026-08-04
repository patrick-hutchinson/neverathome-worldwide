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
import styles from "@/styles/App.module.css";

const pageTransitionVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: (scrollY) => ({
    opacity: 0,
    position: "fixed",
    top: -scrollY,
    left: 0,
    right: 0,
    width: "100%",
    pointerEvents: "none",
  }),
};

const MIN_GLOBE_MOVE_DISTANCE = 400;
const routeMarqueeLabels = {
  "/destinations": "Destinations",
  "/jury": "JuryIntl.",
  "/open-call": "OpenCall",
  "/about": "About",
};
const contentContainerId = "page-content";

function getDistance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function getGlobeOffsetBounds(element) {
  if (!element) return { maxNegativeX: 0, maxPositiveX: 0, maxY: 0 };

  const rootStyles = window.getComputedStyle(document.documentElement);
  const pageMargin = Number.parseFloat(rootStyles.getPropertyValue("--margin")) || 0;
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const centeredLeft = (window.innerWidth - width) / 2;
  const leftZoneMaxRight = (window.innerWidth * 2) / 3 - pageMargin;
  const maxNegativeX = Math.max(0, centeredLeft - pageMargin);
  const maxPositiveX = Math.max(0, leftZoneMaxRight - (centeredLeft + width));
  const maxY = Math.max(0, (window.innerHeight - height) / 2 - pageMargin);

  return { maxNegativeX, maxPositiveX, maxY };
}

function getRandomOffsetFromBounds({ maxNegativeX, maxPositiveX, maxY }) {
  return {
    x: Math.round(-maxNegativeX + Math.random() * (maxPositiveX + maxNegativeX)),
    y: Math.round((Math.random() * 2 - 1) * maxY),
  };
}

function getFarthestBoundedOffset(currentPosition, bounds) {
  const { maxNegativeX, maxPositiveX, maxY } = bounds;
  const corners = [
    { x: -maxNegativeX, y: -maxY },
    { x: -maxNegativeX, y: maxY },
    { x: maxPositiveX, y: -maxY },
    { x: maxPositiveX, y: maxY },
  ];

  return corners.reduce((farthestCorner, corner) =>
    getDistance(corner, currentPosition) > getDistance(farthestCorner, currentPosition) ? corner : farthestCorner,
  );
}

function getRandomBoundedOffset(element, currentPosition = { x: 0, y: 0 }) {
  const { maxNegativeX, maxPositiveX, maxY } = getGlobeOffsetBounds(element);
  const bounds = { maxNegativeX, maxPositiveX, maxY };
  const farthestOffset = getFarthestBoundedOffset(currentPosition, bounds);

  if (getDistance(farthestOffset, currentPosition) < MIN_GLOBE_MOVE_DISTANCE) {
    return farthestOffset;
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const nextOffset = getRandomOffsetFromBounds(bounds);

    if (getDistance(nextOffset, currentPosition) >= MIN_GLOBE_MOVE_DISTANCE) {
      return nextOffset;
    }
  }

  return farthestOffset;
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
  const currentPhase = sharedData.currentPhase || page.phase || null;
  const currentPhaseLabel = getCurrentPhaseLabel(currentPhase)?.replaceAll(" ", "");
  const h1MarqueeText = routeMarqueeLabels[router.pathname] || currentPhaseLabel;
  const isDestinationsPage = router.pathname === "/destinations";

  const [exitingScrollY, setExitingScrollY] = useState(0);
  const [destinationCity, setDestinationCity] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [contentScrollRequest, setContentScrollRequest] = useState(0);
  const globeMoverRef = useRef(null);
  const [globePosition, setGlobePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setExitingScrollY(window.scrollY);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router.events]);

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

  useEffect(() => {
    const keepGlobeInBounds = () => {
      setGlobePosition((currentPosition) => {
        const { maxNegativeX, maxPositiveX, maxY } = getGlobeOffsetBounds(globeMoverRef.current);

        return {
          x: Math.max(-maxNegativeX, Math.min(maxPositiveX, currentPosition.x)),
          y: Math.max(-maxY, Math.min(maxY, currentPosition.y)),
        };
      });
    };

    window.addEventListener("resize", keepGlobeInBounds);

    return () => window.removeEventListener("resize", keepGlobeInBounds);
  }, []);

  const moveGlobeRandomly = () => {
    setGlobePosition((currentPosition) => getRandomBoundedOffset(globeMoverRef.current, currentPosition));
  };

  const scrollToContent = () => {
    document.getElementById(contentContainerId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCityClick = (city) => {
    setDestinationCity(city);

    if (!isDestinationsPage) return;

    setSelectedDestination(city);
    setContentScrollRequest((requestCount) => requestCount + 1);
  };

  useEffect(() => {
    if (!isDestinationsPage) {
      setSelectedDestination(null);
    }
  }, [isDestinationsPage]);

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

  return (
    <>
      <Head>
        <title>{site.title}</title>
        {site.description ? <meta name="description" content={site.description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={site.faviconUrl} />
      </Head>

      <ViewportProvider>
        <DeviceProvider>
          <LenisProvider>
            <Header currentPhase={currentPhase} pageDeadlines={pageDeadlines} site={site} />
            <div className={styles.sharedLayer}>
              <motion.div
                animate={globePosition}
                className={styles.globeMover}
                onHoverStart={moveGlobeRandomly}
                ref={globeMoverRef}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Globe destinationCity={destinationCity} />
              </motion.div>

              <div className={styles.marqueeContainer}>
                {h1MarqueeText ? <Marquee direction="backward" text={h1MarqueeText} typo="h1" /> : null}
                {page.marqueeText ? <Marquee text={page.marqueeText} typo="h4" /> : null}
              </div>
            </div>
            <div className={styles.cityListLayer}>
              <CityList
                accentInactive={isDestinationsPage}
                cities={destinations}
                isClickable={isDestinationsPage}
                onCityClick={isDestinationsPage ? handleCityClick : undefined}
                onCitySelect={setDestinationCity}
                selectedCity={isDestinationsPage ? selectedDestination : null}
              />
            </div>
            <SpacingDebugOverlay />
            <ContentContainer id={contentContainerId}>
              <div className="pageTransitionRoot">
                <AnimatePresence custom={exitingScrollY} initial={false}>
                  <motion.div
                    animate="animate"
                    className="pageTransition"
                    custom={exitingScrollY}
                    exit="exit"
                    initial="initial"
                    key={router.asPath}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    variants={pageTransitionVariants}
                  >
                    <Component {...pageProps} selectedDestination={selectedDestination} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <Footer page={page} />
            </ContentContainer>
          </LenisProvider>
        </DeviceProvider>
      </ViewportProvider>
    </>
  );
}
