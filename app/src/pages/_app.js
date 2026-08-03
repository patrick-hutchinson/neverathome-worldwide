import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { DeviceProvider } from "@/context/DeviceContext";
import LenisProvider from "@/context/LenisContext";
import { ViewportProvider } from "@/context/ViewportContext";
import { fallbackSiteData } from "@/lib/sanity";

import "@/styles/globals.css";
import "@/styles/fonts.css";

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
  const site = pageProps.site || fallbackSiteData;

  const [exitingScrollY, setExitingScrollY] = useState(0);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setExitingScrollY(window.scrollY);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router.events]);

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
