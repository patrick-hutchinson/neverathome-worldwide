import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import CityList from "@/components/CityList/CityList";
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

  const [exitingScrollY, setExitingScrollY] = useState(0);
  const [destinationCity, setDestinationCity] = useState(null);

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
              <Globe destinationCity={destinationCity} />
              <CityList cities={destinations} onCitySelect={setDestinationCity} />

              <div className={styles.marqueeContainer}>
                {currentPhaseLabel ? <Marquee text={currentPhaseLabel} typo="h1" /> : null}
                {page.marqueeText ? <Marquee text={page.marqueeText} typo="h3" /> : null}
              </div>
            </div>
            <SpacingDebugOverlay />
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
                  <Component {...pageProps} />
                </motion.div>
              </AnimatePresence>
            </div>
          </LenisProvider>
        </DeviceProvider>
      </ViewportProvider>
    </>
  );
}
