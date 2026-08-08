import { useEffect, useRef } from "react";

import styles from "./Globe.module.css";

const AUTO_ROTATE_SPEED = 0.001;
const AUTO_ROTATE_EASE_MS = 1800;
const AUTO_ROTATE_INTERACTION_PAUSE_MS = 5000;
const THREE_GLOBE_INTRO_MS = 1200;
const FOCUS_ROTATE_DAMPING = 3.2;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 300;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function Globe({
  cities = [],
  destinationCity,
  onCityMarkerClick,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  globeImageUrl = "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
  bumpImageUrl = "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png",
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
    let animationFrame;
    let renderer;
    let labelRenderer;
    let globe;
    let focusTarget = null;
    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };
    let lastDragTime = 0;
    let lastFrameTime = 0;
    let dragVelocity = { x: 0, y: 0 };
    let autoRotateResumeAt = Number.POSITIVE_INFINITY;
    let removePointerListeners = () => {};
    let isMounted = true;

    async function initGlobe() {
      const [{ default: ThreeGlobe }, THREE, { CSS2DRenderer }] = await Promise.all([
        import("three-globe"),
        import("three"),
        import("three/examples/jsm/renderers/CSS2DRenderer.js"),
      ]);

      if (!isMounted || !globeRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 300;
      lastFrameTime = performance.now();

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);

      labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.className = styles.markerLayer;

      globeRef.current.replaceChildren(renderer.domElement, labelRenderer.domElement);

      const scheduleAutoRotateResume = (delay = 0) => {
        autoRotateResumeAt = performance.now() + delay;
      };

      globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: true })
        .globeImageUrl(globeImageUrl)
        .bumpImageUrl(bumpImageUrl)
        .htmlElementsData(citiesRef.current)
        .htmlLat((city) => city.lat)
        .htmlLng((city) => city.lng)
        .htmlElement((city) => {
          const marker = document.createElement("button");
          marker.type = "button";
          marker.className = styles.cityMarker;
          marker.textContent = city.name;
          marker.addEventListener("pointerdown", (event) => {
            event.stopPropagation();
          });
          marker.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onCityMarkerClickRef.current?.(city);
          });

          return marker;
        })
        .htmlElementVisibilityModifier((element, isVisible) => {
          element.style.opacity = isVisible ? "1" : "0";
          element.style.pointerEvents = isVisible ? "auto" : "none";
        })
        .onGlobeReady(() => {
          scheduleAutoRotateResume(THREE_GLOBE_INTRO_MS);
        });

      scene.add(globe);
      scene.add(new THREE.AmbientLight(0xffffff, 1.8));

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

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
        autoRotateResumeAt = Number.POSITIVE_INFINITY;
      };

      const updateMarkers = (nextCities = []) => {
        globe.htmlElementsData(nextCities);
      };

      sceneRef.current = { focusCity, updateMarkers };
      focusCity(destinationCityRef.current);

      const handlePointerDown = (event) => {
        isDragging = true;
        focusTarget = null;
        dragVelocity = { x: 0, y: 0 };
        autoRotateResumeAt = Number.POSITIVE_INFINITY;
        lastPointer = { x: event.clientX, y: event.clientY };
        lastDragTime = performance.now();
        renderer.domElement.setPointerCapture(event.pointerId);
      };

      const handlePointerMove = (event) => {
        if (!isDragging) return;

        const deltaX = event.clientX - lastPointer.x;
        const deltaY = event.clientY - lastPointer.y;
        const now = performance.now();
        const deltaTime = Math.max(now - lastDragTime, 16);
        lastPointer = { x: event.clientX, y: event.clientY };
        lastDragTime = now;
        dragVelocity = {
          x: deltaX / deltaTime,
          y: deltaY / deltaTime,
        };

        rotateAroundWorldAxis(new THREE.Vector3(0, 1, 0), deltaX * 0.006);
        rotateAroundWorldAxis(new THREE.Vector3(1, 0, 0), deltaY * 0.006);
      };

      const handlePointerUp = (event) => {
        isDragging = false;
        scheduleAutoRotateResume(AUTO_ROTATE_INTERACTION_PAUSE_MS);

        if (renderer.domElement.hasPointerCapture(event.pointerId)) {
          renderer.domElement.releasePointerCapture(event.pointerId);
        }
      };

      renderer.domElement.addEventListener("pointerdown", handlePointerDown);
      renderer.domElement.addEventListener("pointermove", handlePointerMove);
      renderer.domElement.addEventListener("pointerup", handlePointerUp);
      renderer.domElement.addEventListener("pointercancel", handlePointerUp);

      removePointerListeners = () => {
        renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
        renderer.domElement.removeEventListener("pointermove", handlePointerMove);
        renderer.domElement.removeEventListener("pointerup", handlePointerUp);
        renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      };

      function animate() {
        const now = performance.now();
        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;

        if (focusTarget) {
          const dampingAmount = 1 - Math.exp(-FOCUS_ROTATE_DAMPING * deltaSeconds);
          globe.quaternion.slerp(focusTarget, dampingAmount);

          if (globe.quaternion.angleTo(focusTarget) < 0.0005) {
            globe.quaternion.copy(focusTarget);
            focusTarget = null;
            scheduleAutoRotateResume(AUTO_ROTATE_INTERACTION_PAUSE_MS);
          }
        } else if (!isDragging && (Math.abs(dragVelocity.x) > 0.01 || Math.abs(dragVelocity.y) > 0.01)) {
          rotateAroundWorldAxis(new THREE.Vector3(0, 1, 0), dragVelocity.x * 16 * 0.006);
          rotateAroundWorldAxis(new THREE.Vector3(1, 0, 0), dragVelocity.y * 16 * 0.006);

          dragVelocity.x *= 0.94;
          dragVelocity.y *= 0.94;
        } else if (!isDragging && now >= autoRotateResumeAt) {
          const autoRotateProgress = Math.min((now - autoRotateResumeAt) / AUTO_ROTATE_EASE_MS, 1);
          rotateAroundWorldAxis(new THREE.Vector3(0, 1, 0), AUTO_ROTATE_SPEED * easeInOutCubic(autoRotateProgress));
        }

        globe.setPointOfView(camera);
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      }

      animate();
    }

    initGlobe();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrame);
      sceneRef.current = null;
      removePointerListeners();
      renderer?.dispose();
      labelRenderer?.domElement?.remove();
      globeRef.current?.replaceChildren();
    };
  }, [bumpImageUrl, globeImageUrl, height, width]);

  return <div ref={globeRef} className={styles.globe} style={{ width, height }} />;
}
