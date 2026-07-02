"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/Navbar";
import { useSplitReveal } from "@/hooks/useSplitReveal";
import { DESTINATIONS as RAW_DESTINATIONS } from "@/data/destinations";

const DESTINATIONS = RAW_DESTINATIONS.filter(d => d.img && d.lat && d.lon);

// ─── Motion constants ─────────────────────────────────────────────────────────

const M = {
  reveal: { fast: 0.8, mid: 1.1, slow: 1.4 },
  scene: { fast: 1.2, mid: 1.6, slow: 2.0 },
};
const E = {
  entry: "power4.out",
  cinematic: "power3.inOut",
  settle: "expo.out",
};

// ─── Flip motion constants ────────────────────────────────────────────────────
const FLIP = {
  duration: 1.0,        // 0.9–1.1s "expensive" feel
  ease: "power4.inOut",
  overshoot: 6,          // degrees of settle past 0/180
  perspective: 2400,       // px
};


// ─── Great-circle arc ─────────────────────────────────────────────────────────
function greatCirclePoints(lat1, lon1, lat2, lon2, steps = 80) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const φ1 = toRad(lat1), λ1 = toRad(lon1);
  const φ2 = toRad(lat2), λ2 = toRad(lon2);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const d = 2 * Math.asin(Math.sqrt(
      Math.sin((φ2 - φ1) / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
    ));
    if (d < 0.0001) { points.push({ lat: lat1, lon: lon1 }); continue; }
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    points.push({
      lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      lon: toDeg(Math.atan2(y, x)),
    });
  }
  return points;
}

// ─── lat/lon → 3D unit sphere ─────────────────────────────────────────────────
function latLonToVec3(lat, lon, r = 1) {
  const φ = (90 - lat) * Math.PI / 180;
  const θ = (lon + 180) * Math.PI / 180;
  return {
    x: -r * Math.sin(φ) * Math.cos(θ),
    y: r * Math.cos(φ),
    z: r * Math.sin(φ) * Math.sin(θ),
  };
}


// ─── Three.js Globe ───────────────────────────────────────────────────────────
async function buildGlobe(canvas, radius = 1.85) {
  const THREE = await import("three");

  const scene = new THREE.Scene();
  const w = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 600;
  const h = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 600;

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0.12, 5.8);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";

  const loadTex = (url, fallbackFn) => new Promise(res => {
    loader.load(
      url,
      tex => { tex.colorSpace = THREE.SRGBColorSpace; res(tex); },
      undefined,
      () => res(fallbackFn ? fallbackFn() : null)
    );
  });

  const makeFallbackDay = () => {
    const fc = document.createElement("canvas");
    fc.width = 1024; fc.height = 512;
    const ctx = fc.getContext("2d");
    const grd = ctx.createLinearGradient(0, 0, 1024, 512);
    grd.addColorStop(0, "#0b2340");
    grd.addColorStop(0.3, "#112d4e");
    grd.addColorStop(0.6, "#1a3a28");
    grd.addColorStop(1, "#091a2e");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = "rgba(34,72,42,0.55)";
    [[120, 80, 180, 120], [40, 100, 100, 80], [300, 160, 200, 100], [600, 80, 150, 100],
    [700, 200, 120, 80], [200, 300, 250, 80]].forEach(([x, y, rx, ry]) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    });
    const t = new THREE.CanvasTexture(fc);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  const makeFallbackCloud = () => {
    const fc = document.createElement("canvas");
    fc.width = 512; fc.height = 256;
    const ctx = fc.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    [[60, 40, 80, 30], [200, 80, 120, 40], [350, 50, 90, 35], [450, 120, 140, 45],
    [100, 160, 160, 50], [300, 180, 100, 35], [480, 60, 70, 28]].forEach(([x, y, rx, ry]) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    });
    const t = new THREE.CanvasTexture(fc);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  const [dayTex, specTex, cloudTex] = await Promise.all([
    loadTex("/textures/earth-blue-marble.jpg", makeFallbackDay),
    loadTex("/textures/earth-water.png", null),
    loadTex("/textures/earth-clouds.png", makeFallbackCloud),
  ]);

  const sphereGeo = new THREE.SphereGeometry(radius, 96, 96);
  const earthMat = new THREE.MeshPhongMaterial({
    map: dayTex,
    specularMap: specTex || undefined,
    shininess: 38,
    specular: new THREE.Color(0x3366bb),
  });
  const globe = new THREE.Mesh(sphereGeo, earthMat);
  scene.add(globe);

  const cloudGeo = new THREE.SphereGeometry(radius * 1.009, 72, 72);
  const cloudMat = new THREE.MeshPhongMaterial({
    map: cloudTex,
    transparent: true,
    opacity: cloudTex ? 0.38 : 0.10,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  scene.add(clouds);

  const atmosLayers = [
    { r: radius * 1.018, opacity: 0.13, color: 0x4488ff },
    { r: radius * 1.048, opacity: 0.065, color: 0x3366cc },
    { r: radius * 1.10, opacity: 0.030, color: 0x2255bb },
    { r: radius * 1.18, opacity: 0.012, color: 0x1133aa },
  ].map(({ r, opacity, color }) => {
    const geo = new THREE.SphereGeometry(r, 48, 48);
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color), transparent: true,
      opacity, side: THREE.FrontSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return { geo, mat, mesh };
  });

  const limbGeo = new THREE.SphereGeometry(radius + 0.001, 80, 80);
  const limbMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x000816), transparent: true,
    opacity: 0.28, side: THREE.BackSide, depthWrite: false,
  });
  const limbMesh = new THREE.Mesh(limbGeo, limbMat);
  scene.add(limbMesh);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
  scene.add(ambientLight);
  const sun = new THREE.DirectionalLight(0xfff4d6, 1.65);
  sun.position.set(6, 2.5, 5); scene.add(sun);
  const rimLight = new THREE.DirectionalLight(0x3355aa, 0.55);
  rimLight.position.set(-5, -1, -3); scene.add(rimLight);
  const fillLight = new THREE.DirectionalLight(0x112244, 0.18);
  fillLight.position.set(0, -5, 0); scene.add(fillLight);
  const kickLight = new THREE.DirectionalLight(0x5577cc, 0.12);
  kickLight.position.set(0, 4, -6); scene.add(kickLight);

  const starCount = 3500;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r2 = 28 + Math.random() * 22;
    const θ = Math.random() * Math.PI * 2;
    const φ = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r2 * Math.sin(φ) * Math.cos(θ);
    starPos[i * 3 + 1] = r2 * Math.cos(φ);
    starPos[i * 3 + 2] = r2 * Math.sin(φ) * Math.sin(θ);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.032, transparent: true,
    opacity: 0.68, sizeAttenuation: true,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  const R_ROUTE = radius + 0.024;
  const allArcPoints = [];
  for (let i = 0; i < DESTINATIONS.length - 1; i++) {
    const a = DESTINATIONS[i], b = DESTINATIONS[i + 1];
    const pts = greatCirclePoints(a.lat, a.lon, b.lat, b.lon, 80);
    if (i > 0) pts.shift();
    allArcPoints.push(...pts);
  }
  const routeVecs = allArcPoints.map(({ lat, lon }) => {
    const v = latLonToVec3(lat, lon, R_ROUTE);
    return new THREE.Vector3(v.x, v.y, v.z);
  });
  const routeGeom = new THREE.BufferGeometry().setFromPoints(routeVecs);
  const routeMat = new THREE.LineBasicMaterial({ color: 0xd9a857, transparent: true, opacity: 0.88, depthWrite: false });
  const routeLine = new THREE.Line(routeGeom, routeMat);
  routeLine.geometry.setDrawRange(0, 0);
  scene.add(routeLine);
  const ghostMat = new THREE.LineBasicMaterial({ color: 0xd9a857, transparent: true, opacity: 0.07, depthWrite: false });
  const ghostGeom = routeGeom.clone();
  const ghostLine = new THREE.Line(ghostGeom, ghostMat);
  scene.add(ghostLine);

  const particleGeo = new THREE.SphereGeometry(0.018, 10, 10);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0 });
  const particle = new THREE.Mesh(particleGeo, particleMat);
  scene.add(particle);
  const haloGeo = new THREE.SphereGeometry(0.044, 10, 10);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xd9a857, transparent: true, opacity: 0, depthWrite: false });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  scene.add(halo);

  const PIN_R = radius + 0.012;

  const pinObjs = DESTINATIONS.map((dest, idx) => {
    const lv = latLonToVec3(dest.lat, dest.lon, PIN_R);
    const pos = new THREE.Vector3(lv.x, lv.y, lv.z);
    const nrm = pos.clone().normalize();

    const dotGeo = new THREE.SphereGeometry(0.012, 10, 10);
    const dotMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xf5cc76),
      emissive: new THREE.Color(0xd4a030),
      emissiveIntensity: 0.8,
      shininess: 120,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    globe.add(dot);

    const glowGeo = new THREE.SphereGeometry(0.022, 10, 10);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xd9a857),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(pos);
    globe.add(glow);

    const UP3 = new THREE.Vector3(0, 1, 0);
    const ringQ = new THREE.Quaternion().setFromUnitVectors(UP3, nrm);
    const ringGeo = new THREE.RingGeometry(0.013, 0.022, 28);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xf0c050),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.setRotationFromQuaternion(ringQ);
    globe.add(ring);

    const phase = Math.random() * Math.PI * 2;

    return { dot, dotGeo, dotMat, glow, glowGeo, glowMat, ring, ringGeo, ringMat, phase, idx };
  });

  const totalRoutePoints = routeVecs.length;
  let camT = 0;

  function tick(scrollProgress) {
    camT += 0.007;

    const driftX = Math.sin(camT * 0.17) * 0.016;
    const driftY = Math.cos(camT * 0.11) * 0.009;
    const dist = 5.8;
    camera.position.set(
      Math.sin(driftX) * dist,
      driftY * dist + 0.12,
      Math.cos(driftX) * dist
    );
    camera.lookAt(0, 0, 0);

    clouds.rotation.y += 0.00010;

    if (scrollProgress !== undefined) {
      const p = scrollProgress;
      const drawP = Math.min(1, p / 0.75);

      const pIdx = Math.floor(drawP * (totalRoutePoints - 1));
      const nIdx = Math.min(pIdx + 1, totalRoutePoints - 1);
      if (routeVecs[pIdx] && routeVecs[nIdx]) {
        const frac = drawP * (totalRoutePoints - 1) - pIdx;
        const pos = new THREE.Vector3().lerpVectors(routeVecs[pIdx], routeVecs[nIdx], frac);
        particle.position.copy(pos);
        halo.position.copy(pos);
        const vis = drawP > 0.015 && drawP < 0.985 ? 1 : 0;
        particleMat.opacity = vis * 0.95;
        haloMat.opacity = vis * 0.32;
        const pulse = 1 + Math.sin(camT * 6.5) * 0.28;
        halo.scale.setScalar(pulse);
      }

      pinObjs.forEach(({ dotMat, glowMat, ringMat, ring, phase }) => {
        const PULSE_SPEED = 1.4;
        const t = ((camT * PULSE_SPEED + phase) % (Math.PI * 2)) / (Math.PI * 2);
        const ringScale = 1 + t * 1.5;
        const ringOpacity = 0.7 * (1 - t);
        ring.scale.setScalar(ringScale);
        ringMat.opacity = ringOpacity;

        const breathe = Math.sin(camT * 1.8 + phase) * 0.5 + 0.5;
        glowMat.opacity = 0.12 + breathe * 0.14;
        dotMat.opacity = 0.88 + breathe * 0.12;
      });
    }

    renderer.render(scene, camera);
  }

  function tickIdle() {
    camT += 0.007;
    const driftX = Math.sin(camT * 0.17) * 0.016;
    const driftY = Math.cos(camT * 0.11) * 0.009;
    camera.position.set(
      Math.sin(driftX) * 5.8,
      driftY * 5.8 + 0.12,
      Math.cos(driftX) * 5.8
    );
    camera.lookAt(0, 0, 0);
    clouds.rotation.y += 0.00010;

    pinObjs.forEach(({ dotMat, glowMat, ringMat, ring, phase }) => {
      const PULSE_SPEED = 1.4;
      const t = ((camT * PULSE_SPEED + phase) % (Math.PI * 2)) / (Math.PI * 2);
      ring.scale.setScalar(1 + t * 1.5);
      ringMat.opacity = 0.7 * (1 - t);
      const breathe = Math.sin(camT * 1.8 + phase) * 0.5 + 0.5;
      glowMat.opacity = 0.12 + breathe * 0.14;
      dotMat.opacity = 0.88 + breathe * 0.12;
    });

    renderer.render(scene, camera);
  }

  function resize() {
    const cw = canvas.offsetWidth || 600;
    const ch = canvas.offsetHeight || 600;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  }

  return {
    scene, camera, renderer, globe, clouds, routeLine,
    totalRoutePoints, pinObjs, resize, tick, tickIdle,
    dispose() {
      if (dayTex) dayTex.dispose();
      if (specTex) specTex.dispose();
      if (cloudTex) cloudTex.dispose();

      atmosLayers.forEach(({ geo, mat, mesh }) => {
        scene.remove(mesh);
        geo.dispose(); mat.dispose();
      });
      scene.remove(limbMesh);
      limbGeo.dispose(); limbMat.dispose();

      pinObjs.forEach(({ dot, dotGeo, dotMat, glow, glowGeo, glowMat, ring, ringGeo, ringMat }) => {
        globe.remove(dot); globe.remove(glow); globe.remove(ring);
        dotGeo.dispose(); dotMat.dispose();
        glowGeo.dispose(); glowMat.dispose();
        ringGeo.dispose(); ringMat.dispose();
      });

      scene.remove(globe);
      scene.remove(clouds);
      scene.remove(routeLine);
      scene.remove(ghostLine);
      scene.remove(stars);
      scene.remove(particle);
      scene.remove(halo);
      scene.remove(ambientLight);
      scene.remove(sun);
      scene.remove(rimLight);
      scene.remove(fillLight);
      scene.remove(kickLight);

      sphereGeo.dispose(); earthMat.dispose();
      cloudGeo.dispose(); cloudMat.dispose();
      routeGeom.dispose(); routeMat.dispose();
      ghostGeom.dispose(); ghostMat.dispose();
      starGeo.dispose(); starMat.dispose();
      particleGeo.dispose(); particleMat.dispose();
      haloGeo.dispose(); haloMat.dispose();

      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

// ─── Destination Card ─────────────────────────────────────────────────────────
//
// Flip is driven entirely by hover (desktop) and touchstart/touchend (mobile).
// No click. No toggle. No shared state. Each card owns its own animation.
//
function DestCard({ dest, cardRef, isPriority }) {
  const { contextSafe } = useGSAP();

  // ── Existing front-face hover handlers — subtle animations restored ───────
  const handleMouseEnter = contextSafe((e) => {
    const card = e.currentTarget;
    const img = card.querySelector(".dc-img");
    const veil = card.querySelector(".dc-veil");

    gsap.to(card, {
      y: -5,
      boxShadow: "0 32px 64px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
      duration: 0.9,
      ease: "power3.out",
      overwrite: "auto",
    });

    // Very subtle scale and fade to complement the 3D flip without causing visual warping
    if (img) gsap.to(img, { scale: 1.015, duration: 1.4, ease: "power2.out", overwrite: "auto" });
    if (veil) gsap.to(veil, { opacity: 0.8, duration: 0.8, ease: "power2.out", overwrite: "auto" });
  });

  const handleMouseLeave = contextSafe((e) => {
    const card = e.currentTarget;
    const img = card.querySelector(".dc-img");
    const veil = card.querySelector(".dc-veil");

    gsap.to(card, {
      y: 0,
      boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
      duration: 1.0,
      ease: "power3.out",
      overwrite: "auto",
    });

    if (img) gsap.to(img, { scale: 1, duration: 1.2, ease: "power3.out", overwrite: "auto" });
    if (veil) gsap.to(veil, { opacity: 0, duration: 0.8, ease: "power3.out", overwrite: "auto" });
  });

  const highlights = [
    { label: "Experience", value: dest.tag },
    { label: "Ideal Season", value: "Spring & Autumn" },
    { label: "Private Guide", value: "Included" },
  ];

  return (
    <article
      ref={cardRef}
      className="dest-card"
      tabIndex={0}
      style={{
        position: "relative",
        aspectRatio: "3 / 4",
        borderRadius: "18px",
        opacity: 0,
        willChange: "transform, opacity",
        cursor: "pointer",
        background: "#fdfbf7",
        outline: "none",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* ══ 3D flip scaffold ══ */}
      <div
        className="dc-flip-card"
        style={{
          position: "absolute",
          inset: 0,
          perspective: `${FLIP.perspective}px`,
        }}
      >
        {/* Card spine — prevents flash-through at grazing angles */}
        <div
          className="dc-flip-spine"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "18px",
            background: "#2a2725",
          }}
        />

        <div
          className="dc-flip-inner"
          style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}
        >

          {/* ── FRONT FACE ── */}
          <div
            className="dc-flip-front"
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(1px)",
              borderRadius: "18px"
            }}
          >
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <Image
                className="dc-img"
                src={dest.img}
                alt={dest.name}
                fill
                priority={isPriority}
                sizes="(max-width: 680px) 100vw, (max-width: 1200px) 50vw, 25vw"
                style={{
                  objectFit: "cover",
                  transformOrigin: "center center",
                  transform: "translateZ(0)",
                  display: "block",
                }}
              />
            </div>

            {/* Very minimal overlay just at the bottom to ensure text legibility */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(26,23,20,0.5) 0%, rgba(26,23,20,0) 40%)",
              pointerEvents: "none",
              zIndex: 2,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }} />

            <div
              className="dc-veil"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(26,23,20,0.1)",
                opacity: 0,
                pointerEvents: "none",
                zIndex: 3,
                willChange: "opacity",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />

            <div
              className="dc-meta"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "clamp(2.5rem, 4vw, 3.5rem) clamp(2rem, 3.5vw, 2.5rem)",
                zIndex: 4,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                transform: "translateZ(1px)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <p style={{
                color: "#fdfbf7",
                opacity: 0.9,
                fontSize: "0.5rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                fontWeight: 400,
                margin: "0 0 1rem 0",
                lineHeight: 1,
                fontFamily: "inherit",
              }}>
                {dest.region}
              </p>

              <h3
                style={{
                  fontFamily: `var(--font-open-sans, sans-serif)`,
                  fontWeight: 400,
                  fontSize: "clamp(2.4rem, 3.5vw, 3.2rem)",
                  color: "#ffffff",
                  lineHeight: 1.05,
                  letterSpacing: "0em",
                  margin: "0 0 2rem 0",
                }}
              >
                {dest.name}
              </h3>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{
                  color: "#ffffff",
                  opacity: 0.9,
                  fontSize: "0.5rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}>
                  View Journey
                </span>
                <svg width="24" height="8" viewBox="0 0 24 8" fill="none" style={{ opacity: 0.9 }}>
                  <path d="M20 1L23.5 4M23.5 4L20 7M23.5 4H0" stroke="currentColor" strokeWidth="0.75" strokeLinecap="square" />
                </svg>
              </div>
            </div>

            {/* Specular sheen — neutralized background to remove glossy effect safely */}
            <div
              className="dc-flip-sheen"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                pointerEvents: "none",
                opacity: 0,
                background: "transparent",
              }}
            />
          </div>
          {/* ── END FRONT FACE ── */}

          {/* ── BACK FACE ── */}
          <div
            className="dc-flip-back"
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#fdfbf7",
              borderRadius: "18px",
              boxShadow: "inset 0 0 0 1px rgba(42,39,37,0.04), 0 16px 48px rgba(0,0,0,0.04)",
            }}
          >
            {/* Hidden back face image removed to prevent duplicate loading */}

            <div
              style={{
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                padding: "clamp(3rem, 5vw, 4rem) clamp(2.5rem, 4vw, 3rem)",
              }}
            >
              <h3
                className="dc-back-title"
                style={{
                  fontFamily: `var(--font-open-sans, sans-serif)`,
                  fontWeight: 400,
                  fontSize: "clamp(1.4rem, 2vw, 1.8rem)",
                  color: "#2a2725",
                  lineHeight: 1.2,
                  margin: "0 0 1rem 0",
                  willChange: "transform, opacity",
                }}
              >
                {dest.name}
              </h3>

              <p 
                className="dc-back-desc"
                style={{
                color: "#4a4542",
                fontSize: "clamp(0.75rem, 0.9vw, 0.85rem)",
                lineHeight: 1.8,
                margin: "0 0 2.5rem 0",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                willChange: "transform, opacity",
              }}>
                {dest.desc}
              </p>

              <div style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "auto",
              }}>
                {highlights.map((h, i) => (
                  <div key={h.label} className="dc-back-meta" style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    paddingBottom: i !== highlights.length - 1 ? "1.25rem" : "0",
                    marginBottom: i !== highlights.length - 1 ? "1.25rem" : "0",
                    borderBottom: i !== highlights.length - 1 ? "1px solid rgba(42,39,37,0.08)" : "none",
                    willChange: "transform, opacity",
                  }}>
                    <span style={{
                      color: "#8c857e",
                      fontSize: "0.45rem",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}>
                      {h.label}
                    </span>
                    <span style={{
                      color: "#2a2725",
                      fontSize: "clamp(0.85rem, 1vw, 0.95rem)",
                      lineHeight: 1.4,
                      fontWeight: 400,
                      fontFamily: `var(--font-open-sans, sans-serif)`,
                    }}>
                      {h.value}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
                <span className="dc-back-country" style={{
                  color: "#2a2725",
                  fontSize: "0.5rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  flexShrink: 0,
                  willChange: "transform, opacity",
                }}>
                  Private Itinerary
                </span>
                <div className="dc-back-line" style={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(42,39,37,0.15)",
                }} />
                <svg className="dc-back-meta-icon" width="24" height="8" viewBox="0 0 24 8" fill="none" aria-hidden="true" style={{ flexShrink: 0, willChange: "transform, opacity" }}>
                  <path d="M20 1L23.5 4M23.5 4L20 7M23.5 4H0" stroke="#2a2725" strokeWidth="0.75" strokeLinecap="square" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Specular sheen safely neutralized */}
            <div
              className="dc-flip-sheen"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                pointerEvents: "none",
                opacity: 0,
                background: "transparent",
              }}
            />
          </div>
          {/* ── END BACK FACE ── */}

        </div>
      </div>
    </article>
  );
}

// ─── Destinations Grid Section ────────────────────────────────────────────────
function DestinationsGrid({ gridRef }) {
  const cardRefs = useRef([]);

  useGSAP(() => {
    if (!gridRef.current) return;
    const cards = cardRefs.current.filter(Boolean);
    if (!cards.length) return;

    ScrollTrigger.batch(cards, {
      start: "top 85%",
      once: true,
      onEnter: (batch) => {
        gsap.fromTo(batch,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.15,
            overwrite: true,
          }
        );
      },
    });
  }, { scope: gridRef });

  return (
    <section
      ref={gridRef}
      style={{
        background: "var(--bg, #fbf6ed)",
        paddingTop: "clamp(5rem, 12vh, 9rem)",
        paddingBottom: "clamp(6rem, 15vh, 12rem)",
      }}
      aria-label="Premium destinations"
    >
      <div style={{
        maxWidth: "min(100%, 1720px)",
        margin: "0 auto",
        paddingLeft: "clamp(1.5rem, 5vw, 4rem)",
        paddingRight: "clamp(1.5rem, 5vw, 4rem)",
      }}>

        {/* Section header */}
        <div style={{ marginBottom: "clamp(3.5rem, 8vh, 6rem)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "40px", height: "1px", background: "var(--accent, #c5875a)" }} />
            <p className="eyebrow" style={{ color: "var(--ink-soft, #9a8f82)", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              THE COLLECTION · {DESTINATIONS.length} EXCLUSIVE ROUTES
            </p>
          </div>
          <div>
            <h2
              className="display-font"
              style={{
                fontWeight: 300,
                fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
                color: "var(--ink, #1a1612)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Every destination,<br />
              <em style={{ color: "var(--accent, #c5875a)", fontStyle: "italic" }}>curated for you.</em>
            </h2>
          </div>
        </div>

        {/* Grid */}
        <div className="dest-grid-premium">
          {DESTINATIONS.map((dest, i) => (
            <DestCardWithFlip
              key={dest.id}
              dest={dest}
              cardRef={el => { cardRefs.current[i] = el; }}
              isPriority={false}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── DestCardWithFlip ─────────────────────────────────────────────────────────
//
// Each card owns its own flip state and animation. No shared state, no parent
// callbacks, no "only one open" logic. Hover-in → flip to back. Hover-out →
// flip back to front. Touch works identically (touchstart / touchend).
//
// The GSAP timeline runs a single rotateY tween with a subtle overshoot for a
// physical settle feel, plus dynamic shadow travel and specular sheen that are
// both driven directly off the live angle so they stay locked to the geometry.
//
function DestCardWithFlip({ dest, cardRef, isPriority }) {
  const wrapperRef = useRef(null);
  const animatingRef = useRef(false);  // guard against mid-flight re-triggers
  const flippedRef = useRef(false);  // current face: false = front, true = back
  const currentTlRef = useRef(null);   // running timeline so we can kill it on re-enter

  const { contextSafe } = useGSAP({ scope: wrapperRef });

  // ── Core flip runner ────────────────────────────────────────────────────────
  // toBack: true  → rotate to 180° (show back face)
  // toBack: false → rotate to 0°   (show front face)
  const runFlip = useCallback(contextSafe((toBack) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const inner = wrapper.querySelector(".dc-flip-inner");
    const sheenFront = wrapper.querySelector(".dc-flip-front .dc-flip-sheen");
    const sheenBack = wrapper.querySelector(".dc-flip-back  .dc-flip-sheen");

    if (!inner) return;

    // Kill any running flip cleanly so direction changes mid-animation feel
    // fluid rather than snapping. We read the current live rotateY from GSAP's
    // cache rather than querying the element's computed style, so the new tween
    // always starts from exactly where the interrupted one stopped.
    if (currentTlRef.current) {
      currentTlRef.current.kill();
      currentTlRef.current = null;
    }

    // Read where we currently are so an interrupted flip continues from there.
    const currentAngle = gsap.getProperty(inner, "rotateY") || 0;
    const targetAngle = toBack ? 180 : 0;
    const overshootAngle = toBack
      ? targetAngle + FLIP.overshoot
      : targetAngle - FLIP.overshoot;

    const setRotate = gsap.quickSetter(inner, "rotateY", "deg");
    const setSheenFront = sheenFront ? gsap.quickSetter(sheenFront, "opacity") : null;
    const setSheenBack = sheenBack ? gsap.quickSetter(sheenBack, "opacity") : null;

    animatingRef.current = true;

    const state = { angle: Number(currentAngle) };

    const tl = gsap.timeline({
      onComplete: () => {
        // Settle precisely at the resting angle and clear transient effects.
        gsap.set(inner, { rotateY: targetAngle });
        if (sheenFront) gsap.set(sheenFront, { opacity: 0 });
        if (sheenBack) gsap.set(sheenBack, { opacity: 0 });
        animatingRef.current = false;
        flippedRef.current = toBack;
        currentTlRef.current = null;
      },
    });

    currentTlRef.current = tl;

    // Element selectors for back face choreography
    const backLine = wrapper.querySelector(".dc-back-line");
    const backTitle = wrapper.querySelector(".dc-back-title");
    const backDesc = wrapper.querySelector(".dc-back-desc");
    const backMetas = wrapper.querySelectorAll(".dc-back-meta");
    const backCountry = wrapper.querySelector(".dc-back-country");
    const backIcon = wrapper.querySelector(".dc-back-meta-icon");

    if (toBack) {
      // Prime elements for reveal
      if (backLine) gsap.set(backLine, { scaleX: 0, transformOrigin: "left center" });
      if (backTitle) gsap.set(backTitle, { opacity: 0, y: 12 });
      if (backCountry) gsap.set(backCountry, { opacity: 0, y: 12 });
      if (backDesc) gsap.set(backDesc, { opacity: 0, y: 12 });
      if (backMetas.length) gsap.set(backMetas, { opacity: 0, y: 12 });
      if (backIcon) gsap.set(backIcon, { opacity: 0, x: -8 });
    }

    // Main arc — power4.inOut gives the "expensive" deceleration feel.
    tl.to(state, {
      angle: overshootAngle,
      duration: FLIP.duration,
      ease: FLIP.ease,
      onUpdate() {
        setRotate(state.angle);

        // ── Specular sheen: peaks when that face passes through facing-forward.
        // Front faces forward near 0° / 360°, back faces forward near 180°.
        if (setSheenFront) {
          const dFront = Math.min(
            Math.abs(state.angle % 360),
            Math.abs(360 - (state.angle % 360))
          );
          setSheenFront(Math.max(0, 1 - dFront / 35) * 0.85);
        }
        if (setSheenBack) {
          const dBack = Math.abs(((state.angle % 360) + 360) % 360 - 180);
          setSheenBack(Math.max(0, 1 - dBack / 35) * 0.85);
        }
      },
    }, 0);

    // Micro-settle: ease the overshoot back to the exact resting angle.
    tl.to(state, {
      angle: targetAngle,
      duration: 0.16,
      ease: "power2.out",
      onUpdate() { setRotate(state.angle); },
    }, `>${-0.16}`);

    // Choreography
    if (toBack) {
      const startOffset = 0.2; // Start line draw slightly after flip begins
      
      if (backLine) {
        tl.to(backLine, { scaleX: 1, duration: 0.45, ease: "power3.out" }, startOffset);
      }
      
      const titleStart = startOffset + 0.4;
      if (backTitle) {
        tl.to(backTitle, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, titleStart);
      }
      
      const staggerStart = titleStart + 0.15;
      const elementsToStagger = [];
      if (backCountry) elementsToStagger.push(backCountry);
      if (backDesc) elementsToStagger.push(backDesc);
      if (backMetas.length) elementsToStagger.push(...Array.from(backMetas));
      if (backIcon) elementsToStagger.push(backIcon);
      
      if (elementsToStagger.length) {
        tl.to(elementsToStagger, {
          opacity: 1,
          y: 0,
          x: 0, // for the icon
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
        }, staggerStart);
      }
    } else {
      // Hide back face elements immediately when flipping front
      if (backLine) gsap.set(backLine, { scaleX: 0 });
      if (backTitle) gsap.set(backTitle, { opacity: 0 });
      if (backCountry) gsap.set(backCountry, { opacity: 0 });
      if (backDesc) gsap.set(backDesc, { opacity: 0 });
      if (backMetas.length) gsap.set(backMetas, { opacity: 0 });
      if (backIcon) gsap.set(backIcon, { opacity: 0, x: 0 });
    }
  }), [contextSafe]);

  const isTouchRef = useRef(false);

  // ── Event handlers ─────────────────────────────────────────────────────────

  // Desktop: flip to back on enter, restore on leave.
  const onMouseEnterFlip = useCallback(() => {
    if (isTouchRef.current) return; // Prevent simulated hover on mobile from triggering flip
    if (flippedRef.current) return; // already showing back
    runFlip(true);
  }, [runFlip]);

  const onMouseLeaveFlip = useCallback(() => {
    if (isTouchRef.current) return; // Prevent simulated hover on mobile from triggering flip
    if (!flippedRef.current && !animatingRef.current) return;
    runFlip(false);
  }, [runFlip]);

  // Mobile / tablet: Use a robust tap-to-toggle interaction.
  // We use native pointerdown to accurately detect touch vs mouse interaction,
  // and click to perform the toggle so that scrolling doesn't accidentally trigger a flip.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onPointerDown = (e) => {
      isTouchRef.current = (e.pointerType === "touch" || e.pointerType === "pen");
    };

    const onClick = () => {
      if (isTouchRef.current) {
        runFlip(!flippedRef.current);
      }
    };

    wrapper.addEventListener("pointerdown", onPointerDown, { passive: true });
    wrapper.addEventListener("click", onClick);

    return () => {
      wrapper.removeEventListener("pointerdown", onPointerDown);
      wrapper.removeEventListener("click", onClick);
    };
  }, [runFlip]);

  // Cleanup any running timeline on unmount.
  useEffect(() => {
    return () => {
      if (currentTlRef.current) {
        currentTlRef.current.kill();
        currentTlRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ display: "contents" }}
      onMouseEnter={onMouseEnterFlip}
      onMouseLeave={onMouseLeaveFlip}
    >
      <DestCard
        dest={dest}
        cardRef={cardRef}
        isPriority={isPriority}
      />
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ destCount }) {
  return (
    <footer
      className="relative w-full overflow-hidden"
      style={{ background: "var(--ink, #1a1612)", paddingTop: "clamp(3rem,7vh,5rem)", paddingBottom: "clamp(3rem,7vh,5rem)" }}
    >
      <div
        style={{
          maxWidth: "min(100%,1400px)",
          margin: "0 auto",
          paddingLeft: "clamp(1.5rem,6vw,6rem)",
          paddingRight: "clamp(1.5rem,6vw,6rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <p className="eyebrow whitespace-nowrap" style={{ color: "rgba(255,255,255,0.45)", fontSize: "clamp(7px, 2.5vw, 9px)", letterSpacing: "0.2em" }}>
          AL MALLAH FOR TRAVEL & TOURISM L.L.C 2021
        </p>
        <p className="eyebrow" style={{ color: "var(--gold, #d9a857)", fontSize: "9px", letterSpacing: "0.2em" }}>
          {destCount} DESTINATIONS · ONE ROUTE
        </p>
        <a
          href="mailto:info@navigatortravel-jo.com"
          className="body-font eyebrow"
          style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px", letterSpacing: "0.18em", textDecoration: "none" }}
        >
          info@navigatortravel-jo.com
        </a>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const SHOW_GLOBE = false; // TODO: uncomment to restore globe (set to true)

const Destinations = () => {
  const rootRef = useRef(null);
  const takeoffRef = useRef(null);
  const apertureRef = useRef(null);
  const earthRef = useRef(null);
  const globeCanvas = useRef(null);
  const coordRef = useRef(null);
  const altimeterRef = useRef(null);
  const globeState = useRef(null);
  const gridRef = useRef(null);

  useSplitReveal(rootRef);

  useEffect(() => {
    document.body.classList.remove("theme-light");
    return () => { document.body.classList.remove("theme-light"); };
  }, []);

  // ── Globe init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = globeCanvas.current;
    if (!canvas) return;

    let killed = false;
    let tickerFn = null;
    let ro = null;

    const initGlobe = () => {
      if (killed || globeState.current) return;
      buildGlobe(canvas).then(state => {
        if (killed) { state.dispose(); return; }
        globeState.current = state;

        let idleRotation = 0;
        tickerFn = () => {
          if (!state.globe.rotation._scrollControlled) {
            idleRotation += 0.00055;
            state.globe.rotation.y = idleRotation;
            state.clouds.rotation.y = idleRotation * 0.85;
            state.tickIdle();
          }
        };
        gsap.ticker.add(tickerFn);

        ro = new ResizeObserver(() => requestAnimationFrame(() => state.resize()));
        ro.observe(canvas.parentElement || canvas);
      });
    };

    // Defer heavy 3D parsing/texture loading to clear main-thread for LCP
    const timer = setTimeout(initGlobe, 800);

    return () => {
      killed = true;
      clearTimeout(timer);
      if (tickerFn) gsap.ticker.remove(tickerFn);
      if (ro) ro.disconnect();
      if (globeState.current) { globeState.current.dispose(); globeState.current = null; }
    };
  }, []);

  // ── GSAP scroll orchestration ─────────────────────────────────────────────
  useGSAP(() => {

    // ── 1. TAKEOFF SCENE ──────────────────────────────────────────────────
    (() => {
      const section = takeoffRef.current;
      if (!section) return;
      const aperture = apertureRef.current;
      const coord = coordRef.current;
      const words = section.querySelectorAll(".tkf-word");
      const subline = section.querySelector(".tkf-subline");
      const altimeter = altimeterRef.current;

      gsap.set(aperture, { clipPath: "circle(0% at 50% 50%)" });
      gsap.set(words, { y: "110%", filter: "blur(8px)", opacity: 0 });
      gsap.set(subline, { opacity: 0, y: 16 });
      if (altimeter) gsap.set(altimeter, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: "top top", end: "+=220%",
          scrub: 1.0, pin: true, anticipatePin: 1,
        },
      });

      tl.to(aperture, { clipPath: "circle(75% at 50% 50%)", duration: 3, ease: E.cinematic }, 0);
      tl.to(words, { y: "0%", filter: "blur(0px)", opacity: 1, duration: 2.2, ease: E.entry, stagger: 0.08 }, 0.8);
      tl.to(subline, { opacity: 1, y: 0, duration: 1.8, ease: E.entry }, 1.4);

      if (altimeter) {
        tl.to(altimeter, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.4);
        const alt = { v: 0 };
        tl.to(alt, {
          v: 36000, duration: 8, ease: "power2.inOut",
          onUpdate() { altimeter.textContent = `ALT  ${Math.round(alt.v).toLocaleString()} FT`; },
        }, 0.5);
      }

      if (coord) {
        const crd = { lat: 31.5, lon: 36.0 };
        tl.to(crd, {
          lat: 42.0, lon: 48.0, duration: 8, ease: "none",
          onUpdate() {
            const latD = crd.lat >= 0 ? "N" : "S";
            const lonD = crd.lon >= 0 ? "E" : "W";
            coord.textContent = `${Math.abs(crd.lat).toFixed(4)}° ${latD}  /  ${Math.abs(crd.lon).toFixed(4)}° ${lonD}`;
          },
        }, 0.3);
      }

      tl.to(aperture, { clipPath: "circle(150% at 50% 50%)", duration: 2.5, ease: "power2.in" }, 7);
      tl.to(section.querySelector(".tkf-overlay"), { opacity: 0, duration: 1.8, ease: "power2.inOut" }, 7.2);
    })();

    // ── 2. GLOBE SECTION ──────────────────────────────────────────────────
    (() => {
      const section = earthRef.current;
      if (!section) return;
      const earthCoord = section.querySelector(".earth-coord");
      const earthLabel = section.querySelector(".earth-label");
      const earthRuler = section.querySelector(".earth-ruler");
      const destCounter = section.querySelector(".dest-counter-num");

      gsap.set(earthLabel, { opacity: 0, y: 12 });
      gsap.set(earthRuler, { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: "top top", end: "+=380%",
          scrub: 0.8, pin: true, anticipatePin: 1,
          onUpdate(self) {
            const p = self.progress;
            const drawP = Math.min(1, p / 0.75);

            if (earthCoord) {
              const lat = 41.0 - p * 50;
              const lon = 28.0 + p * 88;
              earthCoord.textContent = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}  /  ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
            }
            if (destCounter) {
              destCounter.textContent = String(Math.round(drawP * DESTINATIONS.length)).padStart(2, "0");
            }

            const state = globeState.current;
            if (!state) return;

            state.globe.rotation.y = p * Math.PI * 1.15 + 0.4;
            state.clouds.rotation.y = (p * Math.PI * 1.15 + 0.4) * 0.82;
            state.globe.rotation._scrollControlled = true;

            const count = Math.floor(drawP * state.totalRoutePoints);
            state.routeLine.geometry.setDrawRange(0, Math.max(2, count));

            state.tick(p);
          },
        },
      });

      tl.to(earthLabel, { opacity: 1, y: 0, duration: M.reveal.mid, ease: E.entry }, 0.3);
      tl.to(earthRuler, { scaleX: 1, duration: M.reveal.fast, ease: E.entry }, 0.2);
    })();

    // ── 3. Theme: dark → light ─────────────────────────────────────────────
    if (gridRef.current) {
      ScrollTrigger.create({
        trigger: gridRef.current,
        start: "top 60%",
        end: "top 30%",
        onEnter: () => document.body.classList.add("theme-light"),
        onLeaveBack: () => document.body.classList.remove("theme-light"),
      });
    }

  }, { scope: rootRef });

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} className="relative" style={{ background: "#080808" }}>
      <Navbar />

      {/* ══ HERO — CINEMATIC TAKEOFF ══════════════════════════════════════ */}
      <section
        ref={takeoffRef}
        className="relative w-full h-screen overflow-hidden"
        style={{ background: "#000" }}
        aria-label="Takeoff sequence"
      >
        <div
          ref={apertureRef}
          className="absolute inset-0 z-10"
          style={{ clipPath: "circle(0% at 50% 50%)", willChange: "clip-path" }}
        >
          <div className="absolute inset-0" style={{ opacity: 0.55 }}>
            <Image
              src="/pic/hero-bg.webp"
              alt=""
              fill
              priority
              quality={80}
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "center 40%" }}
            />
          </div>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.72) 100%)" }} />
        </div>

        <div className="absolute inset-0 z-0" style={{ background: "#000" }} />

        <div
          className="tkf-overlay absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
          style={{ paddingLeft: "clamp(1.5rem,6vw,6rem)", paddingRight: "clamp(1.5rem,6vw,6rem)" }}
        >
          <div className="absolute" style={{ top: "clamp(5rem,10vh,7rem)", left: "clamp(1.5rem,6vw,6rem)" }}>
            <p ref={coordRef} className="eyebrow" style={{ color: "var(--gold, #d9a857)", fontSize: "9px", letterSpacing: "0.18em", fontVariantNumeric: "tabular-nums" }}>
              31.5000° N  /  36.0000° E
            </p>
          </div>

          <div className="absolute" style={{ top: "clamp(5rem,10vh,7rem)", right: "clamp(1.5rem,6vw,6rem)" }}>
            <p ref={altimeterRef} className="eyebrow" style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", letterSpacing: "0.18em", fontVariantNumeric: "tabular-nums" }}>
              ALT  0 FT
            </p>
          </div>

          <div className="relative text-center" style={{ maxWidth: "min(100%,900px)" }}>
            <div className="mx-auto mb-8" style={{ width: "1px", height: "clamp(2rem,5vh,4rem)", background: "var(--gold, #d9a857)", opacity: 0.45 }} />
            <p className="eyebrow mb-6" style={{ color: "var(--gold, #d9a857)", letterSpacing: "0.3em", fontSize: "9px" }}>
              Navigator TRAVEL · WORLD ROUTE
            </p>
            <h1 className="display-font font-light leading-none" style={{ fontSize: "clamp(2.8rem,9vw,8rem)", color: "#fff" }}>
              {["The", "Journey", "Begins"].map(word => (
                <span key={word} className="block" style={{ overflow: "hidden" }}>
                  <span className="tkf-word inline-block" style={{ willChange: "transform, filter, opacity" }}>
                    {word === "Journey"
                      ? <em style={{ color: "var(--accent, #c5875a)", fontStyle: "italic" }}>{word}</em>
                      : word}
                  </span>
                </span>
              ))}
            </h1>
            <p className="tkf-subline body-font mt-10" style={{ color: "rgba(255,255,255,0.4)", fontSize: "clamp(0.65rem,1.1vw,0.8rem)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Scroll to depart
            </p>
          </div>

          <div className="absolute flex items-center gap-6" style={{ bottom: "clamp(2rem,5vh,4rem)", left: "clamp(1.5rem,6vw,6rem)" }}>
            <p className="eyebrow" style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px", letterSpacing: "0.2em" }}>HZN-001</p>
            <div style={{ width: "20px", height: "1px", background: "rgba(255,255,255,0.15)" }} />
            <p className="eyebrow" style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px", letterSpacing: "0.2em" }}>WORLD ROUTE · {DESTINATIONS.length} DESTINATIONS</p>
          </div>
        </div>
      </section>

      {/* ══ INTERACTIVE GLOBE ═════════════════════════════════════════════ */}
      {SHOW_GLOBE && (
        <section
          ref={earthRef}
          className="relative w-full h-screen overflow-hidden"
          style={{ background: "#020609" }}
          aria-label="Aerial view — world route"
        >
          <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }}>
            <canvas
              ref={globeCanvas}
              className="w-full h-full"
              style={{ display: "block", willChange: "transform" }}
            />
          </div>

        {/* HUD — top left */}
        <div className="absolute z-20 pointer-events-none" style={{ top: "clamp(5rem,10vh,7rem)", left: "clamp(1.5rem,6vw,6rem)" }}>
          <div
            className="earth-ruler mb-3"
            style={{ width: "32px", height: "1px", background: "var(--gold, #d9a857)", opacity: 0.7, willChange: "transform" }}
          />
          <p className="earth-label eyebrow" style={{ color: "var(--gold, #d9a857)", fontSize: "9px", letterSpacing: "0.22em" }}>
            FLIGHT PATH · {DESTINATIONS.length} DESTINATIONS
          </p>
        </div>

        {/* Live coordinates */}
        <div className="absolute z-20 pointer-events-none" style={{ bottom: "clamp(2rem,5vh,4rem)", left: "clamp(1.5rem,6vw,6rem)" }}>
          <p className="earth-coord eyebrow" style={{ color: "rgba(217,168,87,0.55)", fontSize: "9px", letterSpacing: "0.18em", fontVariantNumeric: "tabular-nums" }}>
            41.0000° N  /  28.0000° E
          </p>
        </div>

        {/* Destination counter — bottom right */}
        <div className="absolute z-20 pointer-events-none text-right" style={{ bottom: "clamp(2rem,5vh,4rem)", right: "clamp(1.5rem,6vw,6rem)" }}>
          <p className="eyebrow mb-1" style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px" }}>DESTINATIONS MAPPED</p>
          <p className="display-font font-light" style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(1.2rem,2.5vw,1.8rem)", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
            <span className="dest-counter-num">00</span>
            <span style={{ fontSize: "0.45em", opacity: 0.5, marginLeft: "0.25em" }}>/ {String(DESTINATIONS.length).padStart(2, "0")}</span>
          </p>
          </div>
        </section>
      )}

      {/* ══ DESTINATIONS GRID ═════════════════════════════════════════════ */}
      <DestinationsGrid gridRef={gridRef} />

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <Footer destCount={DESTINATIONS.length} />
    </div>
  );
};

export default Destinations;    
