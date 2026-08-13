import { useEffect, useRef } from "react";

import styles from "./Globe.module.css";

const FOCUS_ROTATE_DAMPING = 3.2;
const MAX_DEVICE_PIXEL_RATIO = 1.5;
const MAX_GESTURE_DEVICE_PIXEL_RATIO = 3;
const MAX_FRAME_RATE = 60;
const REDUCED_MOTION_FRAME_RATE = 30;
const ENTRY_ANIMATION_MS = 1500;
const ENTRY_SPIN_RADIANS = Math.PI * 2.25;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 300;
const FLOAT_PLAYBACK_RAMP_MS = 650;
const DESKTOP_BREAKPOINT = 769;
const GESTURE_SCALE_MIN = 1;
const GESTURE_SCALE_MAX = 2.4;
const GESTURE_WHEEL_SENSITIVITY = 0.0025;
const GESTURE_PINCH_SENSITIVITY = 0.01;
const GESTURE_RESOLUTION_RESET_DELAY = 280;
const MARKER_FONT_URL = "/fonts/TexGyreHeros-regular.ttf";
const MARKER_FONT_SIZE = 1000;
const MARKER_OUTLINE_OFFSET = 55;
const MARKER_OUTLINE_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
].map(([x, y]) => [x * MARKER_OUTLINE_OFFSET, y * MARKER_OUTLINE_OFFSET]);

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const getPointerDistance = (pointerA, pointerB) => Math.hypot(pointerA.x - pointerB.x, pointerA.y - pointerB.y);

export default function Globe({
  cities = [],
  destinationCity,
  onCityMarkerClick,
  enableHoverScale = false,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  globeImageUrl = "/images/globe/earth-blue-marble.jpg",
  bumpImageUrl = "/images/globe/earth-topology.png",
}) {
  const globeRef = useRef(null);
  const sceneRef = useRef(null);
  const citiesRef = useRef(cities);
  const destinationCityRef = useRef(destinationCity);
  const onCityMarkerClickRef = useRef(onCityMarkerClick);

  useEffect(() => {
    citiesRef.current = cities;
    sceneRef.current?.updateMarkers(cities);
  }, [cities]);

  useEffect(() => {
    destinationCityRef.current = destinationCity;
    sceneRef.current?.focusCity(destinationCity);
  }, [destinationCity]);

  useEffect(() => {
    onCityMarkerClickRef.current = onCityMarkerClick;
  }, [onCityMarkerClick]);

  useEffect(() => {
    const globeElement = globeRef.current;
    if (!globeElement || typeof globeElement.getAnimations !== "function") return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    let animationFrame = null;

    const isFloatAnimation = (animation) => {
      const animationName = animation.animationName || "";
      const keyframes = animation.effect?.getKeyframes?.() || [];

      return (
        animation.effect?.target === globeElement &&
        (animationName.includes("float") ||
          keyframes.some((keyframe) => typeof keyframe.transform === "string" && keyframe.transform.includes("translateY")))
      );
    };

    const getFloatAnimations = () => globeElement.getAnimations().filter(isFloatAnimation);

    const cancelRamp = () => {
      if (!animationFrame) return;

      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };

    const rampFloatPlayback = (targetRate) => {
      cancelRamp();

      const animations = getFloatAnimations();
      if (!animations.length) return;

      animations.forEach((animation) => {
        if (targetRate > 0 && animation.playState === "paused") {
          animation.play();
        }
      });

      const startTime = performance.now();
      const startRates = animations.map((animation) => animation.playbackRate);

      const tick = (now) => {
        const progress = Math.min((now - startTime) / FLOAT_PLAYBACK_RAMP_MS, 1);
        const easedProgress = easeOutCubic(progress);

        animations.forEach((animation, index) => {
          const nextRate = startRates[index] + (targetRate - startRates[index]) * easedProgress;

          if (typeof animation.updatePlaybackRate === "function") {
            animation.updatePlaybackRate(nextRate);
          } else {
            animation.playbackRate = nextRate;
          }
        });

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(tick);
          return;
        }

        animationFrame = null;

        animations.forEach((animation) => {
          if (targetRate === 0) {
            animation.pause();
          }
        });
      };

      animationFrame = window.requestAnimationFrame(tick);
    };

    const handlePointerEnter = () => rampFloatPlayback(0);
    const handlePointerLeave = () => rampFloatPlayback(1);

    globeElement.addEventListener("pointerenter", handlePointerEnter);
    globeElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      cancelRamp();
      globeElement.removeEventListener("pointerenter", handlePointerEnter);
      globeElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    let animationFrame;
    let renderer;
    let labelRenderer;
    let globe;
    let globeGroup;
    let focusTarget = null;
    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };
    let lastDragTime = 0;
    let didDrag = false;
    let lastFrameTime = 0;
    let lastRenderTime = 0;
    let dragVelocity = { x: 0, y: 0 };
    const activePointers = new Map();
    let pinchStartDistance = 0;
    let gestureScale = 1;
    let gestureStartScale = 1;
    let gestureResolutionResetTimer = null;
    let isGestureResolutionBoosted = false;
    let initialRenderBurstEndAt = 0;
    let entryAnimationStartAt = 0;
    let entryAnimationEndAt = 0;
    let hasStartedEntryAnimation = false;
    let isVisible = true;
    let isDocumentVisible = true;
    let needsRender = false;
    let removePointerListeners = () => {};
    let removeVisibilityListeners = () => {};
    let isMounted = true;

    async function initGlobe() {
      const [{ default: ThreeGlobe }, THREE, { CSS2DRenderer }, { default: opentype }, markerFontBuffer] = await Promise.all([
        import("three-globe"),
        import("three"),
        import("three/examples/jsm/renderers/CSS2DRenderer.js"),
        import("opentype.js"),
        fetch(MARKER_FONT_URL).then((response) => (response.ok ? response.arrayBuffer() : null)),
      ]);

      if (!isMounted || !globeRef.current) return;

      const markerFont = markerFontBuffer ? opentype.parse(markerFontBuffer) : null;
      const globeElement = globeRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const frameDuration = 1000 / (prefersReducedMotion ? REDUCED_MOTION_FRAME_RATE : MAX_FRAME_RATE);

      camera.position.z = 300;
      lastFrameTime = performance.now();

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = false;

      labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.className = styles.markerLayer;

      globeElement.replaceChildren(renderer.domElement, labelRenderer.domElement);
      globeGroup = new THREE.Group();
      scene.add(globeGroup);

      if (!prefersReducedMotion) {
        globeGroup.scale.setScalar(0.001);
        globeGroup.rotation.y = ENTRY_SPIN_RADIANS;
      }

      const hasInertia = () => Math.abs(dragVelocity.x) > 0.01 || Math.abs(dragVelocity.y) > 0.01;

      const hasActiveMotion = (now = performance.now()) =>
        needsRender ||
        focusTarget ||
        isDragging ||
        (!prefersReducedMotion && hasInertia()) ||
        now < initialRenderBurstEndAt;

      const requestRender = () => {
        needsRender = true;

        if (animationFrame || !isVisible || !isDocumentVisible) return;

        lastFrameTime = performance.now();
        animationFrame = requestAnimationFrame(animate);
      };

      const isDesktopGestureScaleEnabled = () => window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;

      const setRendererResolution = (isBoosted) => {
        const pixelRatio = isBoosted
          ? Math.min(window.devicePixelRatio * GESTURE_SCALE_MAX, MAX_GESTURE_DEVICE_PIXEL_RATIO)
          : Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);

        renderer.setPixelRatio(pixelRatio);
        requestRender();
      };

      const startEntryAnimation = () => {
        if (!isMounted || hasStartedEntryAnimation) return;

        hasStartedEntryAnimation = true;
        entryAnimationStartAt = performance.now();
        entryAnimationEndAt = prefersReducedMotion ? entryAnimationStartAt : entryAnimationStartAt + ENTRY_ANIMATION_MS;
        initialRenderBurstEndAt = entryAnimationEndAt;

        if (prefersReducedMotion) {
          globeGroup.scale.setScalar(1);
          globeGroup.rotation.y = 0;
        }

        requestRender();
      };

      const clearGestureResolutionReset = () => {
        if (!gestureResolutionResetTimer) return;

        clearTimeout(gestureResolutionResetTimer);
        gestureResolutionResetTimer = null;
      };

      const boostGestureResolution = () => {
        if (prefersReducedMotion) return;

        clearGestureResolutionReset();
        if (isGestureResolutionBoosted) return;

        isGestureResolutionBoosted = true;
        setRendererResolution(true);
      };

      const scheduleGestureResolutionReset = () => {
        clearGestureResolutionReset();

        gestureResolutionResetTimer = setTimeout(() => {
          isGestureResolutionBoosted = false;
          setRendererResolution(false);
          gestureResolutionResetTimer = null;
        }, GESTURE_RESOLUTION_RESET_DELAY);
      };

      const setGestureScale = (nextScale) => {
        gestureScale = clamp(nextScale, GESTURE_SCALE_MIN, GESTURE_SCALE_MAX);
        globeElement.style.setProperty("--globe-gesture-scale", gestureScale.toFixed(3));
        globeElement.style.setProperty("--globe-marker-inverse-scale", (1 / gestureScale).toFixed(3));
        requestRender();
      };

      const resetGestureScale = () => {
        activePointers.clear();
        isDragging = false;
        pinchStartDistance = 0;
        gestureScale = 1;
        globeElement.style.removeProperty("--globe-gesture-scale");
        globeElement.style.removeProperty("--globe-marker-inverse-scale");
        requestRender();
        scheduleGestureResolutionReset();
      };

      const createMarkerSvg = (text) => {
        if (!markerFont) return null;

        const path = markerFont.getPath(text, 0, 0, MARKER_FONT_SIZE);
        const fontScale = MARKER_FONT_SIZE / markerFont.unitsPerEm;
        const ascender = markerFont.ascender * fontScale;
        const descender = markerFont.descender * fontScale;
        const width = markerFont.getAdvanceWidth(text, MARKER_FONT_SIZE);
        const box = {
          x: -MARKER_OUTLINE_OFFSET,
          y: -ascender - MARKER_OUTLINE_OFFSET,
          width: width + MARKER_OUTLINE_OFFSET * 2,
          height: ascender - descender + MARKER_OUTLINE_OFFSET * 2,
        };
        const pathData = path.toPathData(2);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const fillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const aspectRatio = box.height > 0 ? box.width / box.height : 1;

        svg.setAttribute("aria-label", text);
        svg.setAttribute("focusable", "false");
        svg.setAttribute("role", "img");
        svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
        svg.style.setProperty("--city-marker-aspect-ratio", aspectRatio);
        svg.classList.add(styles.cityMarkerSvg);

        MARKER_OUTLINE_OFFSETS.forEach(([x, y]) => {
          const outlinePath = document.createElementNS("http://www.w3.org/2000/svg", "path");

          outlinePath.setAttribute("d", pathData);
          outlinePath.setAttribute("transform", `translate(${x} ${y})`);
          outlinePath.classList.add(styles.cityMarkerSvgOutline);
          svg.append(outlinePath);
        });

        fillPath.setAttribute("d", pathData);
        fillPath.classList.add(styles.cityMarkerSvgFill);

        svg.append(fillPath);

        return svg;
      };

      globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: false })
        .globeImageUrl(globeImageUrl)
        .bumpImageUrl(bumpImageUrl)
        .onGlobeReady(startEntryAnimation)
        .showAtmosphere(false)
        .htmlElementsData(citiesRef.current)
        .htmlLat((city) => city.lat)
        .htmlLng((city) => city.lng)
        .htmlElement((city) => {
          const marker = document.createElement("button");
          const markerText = createMarkerSvg(city.name) || document.createElement("span");
          marker.type = "button";
          marker.className = styles.cityMarker;
          markerText.classList.add(styles.cityMarkerText);

          if (!markerText.textContent && !markerText.firstChild) {
            markerText.textContent = city.name;
          }

          marker.append(markerText);
          marker.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (didDrag) return;

            onCityMarkerClickRef.current?.(city);
          });

          return marker;
        })
        .htmlElementVisibilityModifier((element, isVisible) => {
          element.style.opacity = isVisible ? "1" : "0";
          element.style.pointerEvents = isVisible ? "auto" : "none";
        });

      globeGroup.add(globe);
      globe.pauseAnimation?.();
      scene.add(new THREE.AmbientLight(0xffffff, 2.2));

      const rotateAroundWorldAxis = (axis, angle) => {
        globe.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
      };

      const focusCity = (city) => {
        if (!city) return;

        dragVelocity = { x: 0, y: 0 };

        const cityCoords = globe.getCoords(city.lat, city.lng, 0);
        const northCoords = globe.getCoords(Math.min(city.lat + 0.1, 90), city.lng, 0);
        const cityPosition = new THREE.Vector3(cityCoords.x, cityCoords.y, cityCoords.z).normalize();
        const northPosition = new THREE.Vector3(northCoords.x, northCoords.y, northCoords.z).normalize();
        const localUp = northPosition.sub(cityPosition).projectOnPlane(cityPosition).normalize();
        const localRight = new THREE.Vector3().crossVectors(localUp, cityPosition).normalize();
        const localBasis = new THREE.Matrix4().makeBasis(localRight, localUp, cityPosition);
        const worldBasis = new THREE.Matrix4().makeBasis(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 1),
        );
        const targetMatrix = worldBasis.multiply(localBasis.invert());

        focusTarget = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);

        if (prefersReducedMotion) {
          globe.quaternion.copy(focusTarget);
          focusTarget = null;
        }

        requestRender();
      };

      const updateMarkers = (nextCities = []) => {
        globe.htmlElementsData(nextCities);
        requestRender();
      };

      sceneRef.current = { focusCity, updateMarkers };
      focusCity(destinationCityRef.current);

      const handlePointerDown = (event) => {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        globeElement.setPointerCapture(event.pointerId);

        if (activePointers.size >= 2) {
          const [pointerA, pointerB] = Array.from(activePointers.values());

          pinchStartDistance = getPointerDistance(pointerA, pointerB);
          gestureStartScale = gestureScale;
          isDragging = false;
          focusTarget = null;
          dragVelocity = { x: 0, y: 0 };
          didDrag = true;
          boostGestureResolution();
          requestRender();
          return;
        }

        isDragging = true;
        focusTarget = null;
        dragVelocity = { x: 0, y: 0 };
        didDrag = false;
        lastPointer = { x: event.clientX, y: event.clientY };
        lastDragTime = performance.now();
        requestRender();
      };

      const handlePointerMove = (event) => {
        if (activePointers.has(event.pointerId)) {
          activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }

        if (activePointers.size >= 2) {
          const [pointerA, pointerB] = Array.from(activePointers.values());
          const nextDistance = getPointerDistance(pointerA, pointerB);

          if (pinchStartDistance > 0) {
            setGestureScale(gestureStartScale * (nextDistance / pinchStartDistance));
          }

          return;
        }

        if (!isDragging) return;

        const deltaX = event.clientX - lastPointer.x;
        const deltaY = event.clientY - lastPointer.y;
        const now = performance.now();
        const deltaTime = Math.max(now - lastDragTime, 16);
        didDrag = didDrag || Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;
        lastPointer = { x: event.clientX, y: event.clientY };
        lastDragTime = now;
        dragVelocity = prefersReducedMotion
          ? { x: 0, y: 0 }
          : {
              x: deltaX / deltaTime,
              y: deltaY / deltaTime,
            };

        rotateAroundWorldAxis(new THREE.Vector3(0, 1, 0), deltaX * 0.006);
        rotateAroundWorldAxis(new THREE.Vector3(1, 0, 0), deltaY * 0.006);
        requestRender();
      };

      const handlePointerUp = (event) => {
        activePointers.delete(event.pointerId);
        isDragging = false;

        if (globeElement.hasPointerCapture(event.pointerId)) {
          globeElement.releasePointerCapture(event.pointerId);
        }

        if (activePointers.size === 1) {
          const [pointer] = Array.from(activePointers.values());

          lastPointer = { x: pointer.x, y: pointer.y };
          lastDragTime = performance.now();
          pinchStartDistance = 0;
          gestureStartScale = gestureScale;
          return;
        }

        pinchStartDistance = 0;
        requestRender();
      };

      const handleWheel = (event) => {
        if (!isDesktopGestureScaleEnabled()) return;

        event.preventDefault();
        event.stopPropagation();

        boostGestureResolution();
        const sensitivity = event.ctrlKey ? GESTURE_PINCH_SENSITIVITY : GESTURE_WHEEL_SENSITIVITY;
        setGestureScale(gestureScale * Math.exp(-event.deltaY * sensitivity));
      };

      const handleGestureStart = (event) => {
        if (!isDesktopGestureScaleEnabled()) return;

        event.preventDefault();
        event.stopPropagation();
        boostGestureResolution();
        gestureStartScale = gestureScale;
      };

      const handleGestureChange = (event) => {
        if (!isDesktopGestureScaleEnabled()) return;

        event.preventDefault();
        event.stopPropagation();
        setGestureScale(gestureStartScale * Number(event.scale || 1));
      };

      globeElement.addEventListener("pointerdown", handlePointerDown);
      globeElement.addEventListener("pointerenter", boostGestureResolution);
      globeElement.addEventListener("pointermove", handlePointerMove);
      globeElement.addEventListener("pointerup", handlePointerUp);
      globeElement.addEventListener("pointercancel", handlePointerUp);
      globeElement.addEventListener("pointerleave", resetGestureScale);
      globeElement.addEventListener("wheel", handleWheel, { passive: false });
      globeElement.addEventListener("gesturestart", handleGestureStart);
      globeElement.addEventListener("gesturechange", handleGestureChange);

      removePointerListeners = () => {
        globeElement.removeEventListener("pointerdown", handlePointerDown);
        globeElement.removeEventListener("pointerenter", boostGestureResolution);
        globeElement.removeEventListener("pointermove", handlePointerMove);
        globeElement.removeEventListener("pointerup", handlePointerUp);
        globeElement.removeEventListener("pointercancel", handlePointerUp);
        globeElement.removeEventListener("pointerleave", resetGestureScale);
        globeElement.removeEventListener("wheel", handleWheel);
        globeElement.removeEventListener("gesturestart", handleGestureStart);
        globeElement.removeEventListener("gesturechange", handleGestureChange);
        clearGestureResolutionReset();
      };

      function animate(now = performance.now()) {
        animationFrame = undefined;

        if (!isVisible || !isDocumentVisible) return;

        if (now - lastRenderTime < frameDuration) {
          animationFrame = requestAnimationFrame(animate);
          return;
        }

        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        lastRenderTime = now;
        needsRender = false;

        if (!prefersReducedMotion && !hasStartedEntryAnimation) {
          globeGroup.scale.setScalar(0.001);
          globeGroup.rotation.y = ENTRY_SPIN_RADIANS;
        } else if (!prefersReducedMotion && now <= entryAnimationEndAt) {
          const progress = Math.min(Math.max((now - entryAnimationStartAt) / ENTRY_ANIMATION_MS, 0), 1);
          const easedProgress = easeOutCubic(progress);

          globeGroup.scale.setScalar(Math.max(easedProgress, 0.001));
          globeGroup.rotation.y = (1 - easedProgress) * ENTRY_SPIN_RADIANS;
        } else if (globeGroup.scale.x !== 1 || globeGroup.rotation.y !== 0) {
          globeGroup.scale.setScalar(1);
          globeGroup.rotation.y = 0;
        }

        if (focusTarget) {
          const dampingAmount = 1 - Math.exp(-FOCUS_ROTATE_DAMPING * deltaSeconds);
          globe.quaternion.slerp(focusTarget, dampingAmount);

          if (globe.quaternion.angleTo(focusTarget) < 0.0005) {
            globe.quaternion.copy(focusTarget);
            focusTarget = null;
          }
        } else if (
          !prefersReducedMotion &&
          !isDragging &&
          (Math.abs(dragVelocity.x) > 0.01 || Math.abs(dragVelocity.y) > 0.01)
        ) {
          rotateAroundWorldAxis(new THREE.Vector3(0, 1, 0), dragVelocity.x * 16 * 0.006);
          rotateAroundWorldAxis(new THREE.Vector3(1, 0, 0), dragVelocity.y * 16 * 0.006);

          dragVelocity.x *= 0.94;
          dragVelocity.y *= 0.94;
        }

        globe.setPointOfView(camera);
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);

        if (hasActiveMotion(now)) {
          animationFrame = requestAnimationFrame(animate);
        }
      }

      const intersectionObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;

        if (isVisible) requestRender();
      });
      intersectionObserver.observe(globeElement);

      const handleVisibilityChange = () => {
        isDocumentVisible = document.visibilityState === "visible";

        if (isDocumentVisible) requestRender();
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      removeVisibilityListeners = () => {
        intersectionObserver.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };

      requestRender();
    }

    initGlobe();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrame);
      sceneRef.current = null;
      removePointerListeners();
      removeVisibilityListeners();
      renderer?.dispose();
      labelRenderer?.domElement?.remove();
      globeRef.current?.replaceChildren();
    };
  }, [bumpImageUrl, globeImageUrl, height, width]);

  return (
    <div
      ref={globeRef}
      className={[styles.globe, enableHoverScale ? styles.globeHoverScale : ""].filter(Boolean).join(" ")}
      style={{ width, height }}
    />
  );
}
