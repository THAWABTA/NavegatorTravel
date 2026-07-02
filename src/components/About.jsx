import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Quote, ChevronLeft, ChevronRight, Sparkles, KeyRound, Compass, Headset } from 'lucide-react';
import ConciergeSection from './ConciergeSection';

gsap.registerPlugin(ScrollTrigger);

import { DESTINATIONS } from '../data/destinations';

const featuredDestinations = DESTINATIONS.filter(d => d.featured && d.img);
const secondaryDestinations = DESTINATIONS.filter(d => d.secondary && d.img);

const testimonials = [
  { quote: "The most extraordinary journey of our lives. Every detail felt considered, from the first email to the final sunset.", name: "Sarah & James Williams", location: "London", img: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80" },
  { quote: "Navigator turned our anniversary into something we'll talk about for the rest of our lives. Effortless, warm, unforgettable.", name: "Lina Haddad", location: "Amman", img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" },
  { quote: "From Istanbul to Dubai in a single seamless trip — every transfer, every stay, perfectly timed. True concierge travel.", name: "Omar Al-Farsi", location: "Dubai", img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80" },
];

const mapPins = [
  { label: "Istanbul",        top: "32%", left: "53%" },
  { label: "Dubai",           top: "48%", left: "63%" },
  { label: "Trabzon",         top: "30%", left: "58%" },
  { label: "Sharm El Sheikh", top: "46%", left: "58%" },
  { label: "Tbilisi",         top: "29%", left: "60%" },
  { label: "Batumi",          top: "30%", left: "59%" },
  { label: "Antalya",         top: "35%", left: "52%" },
  { label: "Sri Lanka",       top: "58%", left: "68%" },
  { label: "Phuket",          top: "62%", left: "76%" },
  { label: "Kuala Lumpur",    top: "63%", left: "78%" },
  { label: "Cairo",           top: "40%", left: "57%" },
  { label: "Baku",            top: "31%", left: "62%" },
];

function measureCenter(rect, originRect) {
  return {
    x: rect.left - originRect.left + rect.width  * 0.5,
    y: rect.top  - originRect.top  + rect.height * 0.5,
  };
}

function resolveTitleNode(chapter) {
  const h3 = chapter.querySelector('.chapter-title');
  if (!h3) return null;
  return h3.querySelector('span') ?? h3;
}

function collectKnots(chapters, corridorWrap) {
  const originRect = corridorWrap.getBoundingClientRect();
  const nodes      = chapters.map(ch => resolveTitleNode(ch));
  const rects      = nodes.map(node => node ? node.getBoundingClientRect() : null);
  const pts        = rects.map(r => r ? measureCenter(r, originRect) : null);
  return pts.every(Boolean) ? pts : null;
}

function computeKBTangentsAxis(values, h, tension) {
  const n   = values.length;
  const out = new Float64Array(n);
  const k   = (1 - tension) * 0.5;
  for (let i = 1; i < n - 1; i++) {
    const slopePrev = (values[i]     - values[i - 1]) / h[i - 1];
    const slopeNext = (values[i + 1] - values[i])     / h[i];
    out[i] = k * (slopePrev + slopeNext);
  }
  out[0]     = k * 2 * (values[1]     - values[0])     / h[0];
  out[n - 1] = k * 2 * (values[n - 1] - values[n - 2]) / h[n - 2];
  return out;
}

function buildSplinePathD(pts, h, Tx, Ty) {
  const n   = pts.length;
  const fmt = v => v.toFixed(3);
  let d = `M ${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const hi   = h[i];
    const cp1x = pts[i].x     + (hi / 3) * Tx[i];
    const cp1y = pts[i].y     + (hi / 3) * Ty[i];
    const cp2x = pts[i + 1].x - (hi / 3) * Tx[i + 1];
    const cp2y = pts[i + 1].y - (hi / 3) * Ty[i + 1];
    d += ` C ${fmt(cp1x)} ${fmt(cp1y)}, ${fmt(cp2x)} ${fmt(cp2y)}, ${fmt(pts[i + 1].x)} ${fmt(pts[i + 1].y)}`;
  }
  return d;
}

const KB_TENSION = 0.35;

function buildSplinePath(pts) {
  const n = pts.length;
  if (n < 2) return '';
  if (n === 2) {
    return `M ${pts[0].x.toFixed(3)} ${pts[0].y.toFixed(3)} L ${pts[1].x.toFixed(3)} ${pts[1].y.toFixed(3)}`;
  }
  const h = new Float64Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    h[i] = Math.max(Math.sqrt(dx * dx + dy * dy), 1e-9);
  }
  const xVals = new Float64Array(n);
  const yVals = new Float64Array(n);
  pts.forEach((p, i) => { xVals[i] = p.x; yVals[i] = p.y; });
  const Tx = computeKBTangentsAxis(xVals, h, KB_TENSION);
  const Ty = computeKBTangentsAxis(yVals, h, KB_TENSION);
  return buildSplinePathD(pts, h, Tx, Ty);
}

const ANCHOR_STEPS = 128;

function computeChapterAnchors(pts, pathElement, totalLength) {
  return pts.map((pt, i) => {
    if (i === 0)              return 0;
    if (i === pts.length - 1) return 1;
    let bestFrac = 0;
    let bestDist = Infinity;
    for (let s = 0; s <= ANCHOR_STEPS; s++) {
      const frac = s / ANCHOR_STEPS;
      const sp   = pathElement.getPointAtLength(frac * totalLength);
      const dist = (sp.x - pt.x) ** 2 + (sp.y - pt.y) ** 2;
      if (Number.isFinite(dist) && dist < bestDist) { bestDist = dist; bestFrac = frac; }
    }
    return bestFrac;
  });
}

function createDrawFn({ pathEl, glowEl, baseEl, totalLength, chapterAnchors, chapters }) {
  const setDash     = gsap.quickSetter(pathEl,  'strokeDashoffset', 'px');
  const setGlowDash = gsap.quickSetter(glowEl,  'strokeDashoffset', 'px');
  const setBaseDash = gsap.quickSetter(baseEl,  'strokeDashoffset', 'px');
  let activeIdx = -1;
  return function draw(progress) {
    const drawLength = totalLength * progress;
    const dashOffset = Math.round((totalLength - drawLength) * 100) / 100;
    setDash(dashOffset);
    setGlowDash(dashOffset);
    setBaseDash(dashOffset);
    let nextIdx = -1;
    for (let i = 0; i < chapterAnchors.length; i++) {
      if (progress >= chapterAnchors[i]) nextIdx = i;
    }
    if (nextIdx === activeIdx) return;
    if (activeIdx >= 0) {
      const c     = chapters[activeIdx];
      const title = c.querySelector('.chapter-title');
      const img   = c.querySelector('.chapter-img');
      const card  = c.querySelector('.chapter-postcard');
      c.classList.remove('chapter-active');
      if (title) gsap.to(title, { color: 'var(--ink)', duration: 0.55, ease: 'power2.out' });
      if (img)   gsap.to(img,   { filter: 'saturate(1) brightness(1)', duration: 0.6 });
      if (card)  gsap.to(card,  { boxShadow: '0 2px 4px rgba(0,0,0,0.04),0 8px 18px rgba(0,0,0,0.08),0 28px 48px -12px rgba(0,0,0,0.18)', duration: 0.6 });
    }
    if (nextIdx >= 0) {
      const c     = chapters[nextIdx];
      const title = c.querySelector('.chapter-title');
      const img   = c.querySelector('.chapter-img');
      const card  = c.querySelector('.chapter-postcard');
      c.classList.add('chapter-active');
      if (title) gsap.to(title, { color: 'var(--accent)', duration: 0.55, ease: 'power2.out' });
      if (img)   gsap.to(img,   { filter: 'saturate(1.22) brightness(1.05)', duration: 0.6 });
      if (card)  gsap.to(card,  { boxShadow: '0 4px 8px rgba(0,0,0,0.06),0 16px 32px rgba(0,0,0,0.12),0 40px 64px -12px rgba(0,0,0,0.26)', duration: 0.6 });
    }
    activeIdx = nextIdx;
  };
}

function buildGeometry({ corridorWrap, routeSvg, pathEl, glowEl, baseEl, chapters, currentProgress }) {
  const pts = collectKnots(chapters, corridorWrap);
  if (!pts) return null;
  const corridorRect = corridorWrap.getBoundingClientRect();
  const W = corridorRect.width;
  const H = corridorWrap.scrollHeight;
  if (!W || !H) return null;
  routeSvg.setAttribute('viewBox', `0 0 ${W.toFixed(3)} ${H}`);
  Object.assign(routeSvg.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: `${H}px`,
    pointerEvents: 'none', overflow: 'visible',
  });
  const d = buildSplinePath(pts);
  [baseEl, pathEl, glowEl].forEach(el => { if (el) el.setAttribute('d', d); });
  const totalLength = pathEl.getTotalLength();
  if (!totalLength) return null;
  gsap.set([pathEl, glowEl, baseEl], { strokeDasharray: totalLength });
  const chapterAnchors = computeChapterAnchors(pts, pathEl, totalLength);
  const draw = createDrawFn({ pathEl, glowEl, baseEl, totalLength, chapterAnchors, chapters });
  draw(currentProgress);
  return draw;
}

function createScrollTrigger({ chapters, draw }) {
  const firstTitle = resolveTitleNode(chapters[0]);
  const lastTitle  = resolveTitleNode(chapters[chapters.length - 1]);
  const st = ScrollTrigger.create({
    trigger:    firstTitle,
    endTrigger: lastTitle,
    start:      'center bottom',
    end:        'center top',
    scrub:      0.15,
    onUpdate:   self => draw(self.progress),
  });
  draw(st.progress);
  return st;
}

function attachChapterAnimationsResponsive(chapters) {
  const cleanups = [];
  const VP = getVP();
  chapters.forEach(ch => {
    const reversed = ch.dataset.side === 'right';
    const copy     = ch.querySelector('.chapter-copy');
    const postcard = ch.querySelector('.chapter-postcard');
    const num      = ch.querySelector('.chapter-num');
    const img      = ch.querySelector('.chapter-img');
    const copyX = VP.isMobile ? 0 : VP.x(0.025, 20, 42) * (reversed ? 1 : -1);
    const copyY = VP.isMobile ? VP.y(0.015, 12, 20) : 0;
    if (copy) gsap.fromTo(copy,
      { opacity: 0, x: copyX, y: copyY },
      { opacity: 1, x: 0, y: 0, duration: 1.1, ease: 'power4.out',
        scrollTrigger: { trigger: ch, start: 'top 80%' } }
    );
    const cardY = VP.y(0.035, 18, 52);
    const cardS = VP.isMobile ? 0.96 : 0.9;
    if (postcard) gsap.fromTo(postcard,
      { opacity: 0, y: cardY, scale: cardS },
      { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: 'power4.out', delay: 0.08,
        scrollTrigger: { trigger: ch, start: 'top 80%' } }
    );
    if (num) gsap.fromTo(num,
      { opacity: 0 },
      { opacity: 1, duration: 1.4, ease: 'power2.out',
        scrollTrigger: { trigger: ch, start: 'top 84%' } }
    );
    const imgYPct = VP.isMobile ? -4 : VP.isTablet ? -6 : -10;
    if (img) gsap.fromTo(img,
      { scale: VP.isMobile ? 1.06 : 1.15, rotate: VP.hasPerspective ? (reversed ? 2 : -2) : 0 },
      { scale: 1, rotate: 0, yPercent: imgYPct, ease: 'none',
        scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } }
    );
    if (postcard && VP.hasPointer) {
      const liftY = VP.y(0.005, 5, 10);
      const onEnter = () => {
        gsap.to(postcard, { y: -liftY, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        if (img) gsap.to(img, { filter: 'brightness(1.08) saturate(1.1)', duration: 0.4, overwrite: 'auto' });
      };
      const onLeave = () => {
        gsap.to(postcard, { y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        if (img) gsap.to(img, { filter: 'brightness(1) saturate(1)', duration: 0.4, overwrite: 'auto' });
      };
      postcard.addEventListener('mouseenter', onEnter);
      postcard.addEventListener('mouseleave', onLeave);
      postcard.addEventListener('focusin',    onEnter);
      postcard.addEventListener('focusout',   onLeave);
      cleanups.push(() => {
        postcard.removeEventListener('mouseenter', onEnter);
        postcard.removeEventListener('mouseleave', onLeave);
        postcard.removeEventListener('focusin',    onEnter);
        postcard.removeEventListener('focusout',   onLeave);
      });
    }
  });
  return cleanups;
}

function getVP() {
  const w = window.innerWidth;
  const isMobile  = w <  768;
  const isTablet  = w >= 768  && w < 1024;
  const isLaptop  = w >= 1024 && w <= 1440;
  const isDesktop = w >  1440;
  const scale = isMobile ? 0.0 : isTablet ? 0.6 : isLaptop ? 0.8 : 1.0;
  const vw = (pct, min, max) => Math.min(Math.max(w * pct, min), max);
  return {
    w, isMobile, isTablet, isLaptop, isDesktop, scale,
    hasPointer:     !isMobile,
    hasPerspective: !isMobile && !isTablet,
    hasMagnetic:    !isMobile,
    hasAmbient:     !isMobile,
    y:  (pct, min, max) => vw(pct, min, max) * scale || min,
    x:  (pct, min, max) => vw(pct, min, max) * scale || min,
    px: (full)           => Math.round(full * scale),
    tiltDeg:  isMobile ? 0 : isTablet ? 0 : isLaptop ? 2.5 : 3.5,
    floatAmp: (base) => isMobile ? 0 : isTablet ? base * 0.5 : base * scale,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

const About = () => {
  const rootRef = useRef(null);

  // ─── TYPOGRAPHY MOTION SYSTEM ─────────────────────────────────────────────
  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const splits = [];

    // Reset أي state متبقي من render سابق (يحل مشكلة الـ refresh)
    root.querySelectorAll('[data-text-ready]').forEach(el => {
      delete el.dataset.textReady;
    });

    const initText = async () => {
      try { await document.fonts.ready; } catch (_) {}
      await new Promise(r => requestAnimationFrame(r));

      // TIER 1 — HEADINGS: clip-path line reveal
      root.querySelectorAll('[data-text-heading]').forEach(el => {
        if (el.dataset.textReady) return;
        el.dataset.textReady = '1';
        gsap.set(el, { visibility: 'hidden' });
        const split = new SplitType(el, { types: 'lines', tagName: 'span' });
        splits.push(split);
        split.lines.forEach(line => {
          const wrapper = document.createElement('span');
          wrapper.style.cssText = 'display:block;overflow:hidden;padding-bottom:0.08em;margin-bottom:-0.08em;';
          line.parentNode.insertBefore(wrapper, line);
          wrapper.appendChild(line);
          gsap.set(line, { y: '100%', opacity: 0 });
        });
        gsap.set(el, { visibility: 'visible' });
        if (noMotion) {
          split.lines.forEach(line => gsap.set(line, { y: 0, opacity: 1 }));
          return;
        }
        gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            toggleActions: 'play none none none',
            once: true,
          },
        }).to(split.lines, {
          y: 0,
          opacity: 1,
          duration: 1.05,
          ease: 'power4.out',
          stagger: 0.11,
        });
      });

      // TIER 2 — BODY TEXT: opacity + lift
      root.querySelectorAll('[data-text-body]').forEach(el => {
        if (el.dataset.textReady) return;
        el.dataset.textReady = '1';
        gsap.set(el, { opacity: 0, y: 14 });
        if (noMotion) { gsap.set(el, { opacity: 1, y: 0 }); return; }
        gsap.to(el, {
          opacity: 1, y: 0,
          duration: 0.85, ease: 'power3.out',
          scrollTrigger: {
            trigger: el, start: 'top 85%',
            toggleActions: 'play none none none', once: true,
          },
        });
      });

      // TIER 3 — EYEBROWS: surface fade
      root.querySelectorAll('[data-text-eyebrow]').forEach(el => {
        if (el.dataset.textReady) return;
        el.dataset.textReady = '1';
        gsap.set(el, { opacity: 0, y: 7 });
        if (noMotion) { gsap.set(el, { opacity: 1, y: 0 }); return; }
        gsap.to(el, {
          opacity: 1, y: 0,
          duration: 0.65, ease: 'power2.out',
          scrollTrigger: {
            trigger: el, start: 'top 88%',
            toggleActions: 'play none none none', once: true,
          },
        });
      });

      ScrollTrigger.refresh();
    };

    initText();

    return () => {
      splits.forEach(s => { try { s.revert(); } catch (_) {} });
      root.querySelectorAll('[data-text-ready]').forEach(el => {
        delete el.dataset.textReady;
      });
    };
  }, { scope: rootRef });

  // ─── SCROLL / CORRIDOR ────────────────────────────────────────────────────
  useGSAP(() => {
    const cleanupFns = [];
    const VP = getVP();

    rootRef.current.querySelectorAll('.manifesto-media-img').forEach(el => {
      const scaleFrom = VP.isMobile ? 1.06 : VP.isTablet ? 1.08 : 1.15;
      const yFrom     = VP.isMobile ? -3   : VP.isTablet ? -5   : -8;
      gsap.fromTo(el,
        { scale: scaleFrom, yPercent: yFrom },
        { scale: 1, yPercent: 0, ease: 'none',
          scrollTrigger: { trigger: el.closest('.manifesto-media-wrap'), start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    });

    rootRef.current.querySelectorAll('.manifesto-media-wrap').forEach(el => {
      const inset = VP.isMobile ? '3% 2% 3% 2%' : VP.isTablet ? '4% 3% 4% 3%' : '6% 6% 6% 6%';
      gsap.fromTo(el,
        { clipPath: `inset(${inset})`, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 1.4, ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 78%' } }
      );
    });

    rootRef.current.querySelectorAll('.philosophy-item').forEach((el, i) => {
      const num  = el.querySelector('.philosophy-num');
      const rule = el.querySelector('.philosophy-rule');
      const yOff = VP.y(0.02, 12, 30);
      gsap.fromTo(el,
        { opacity: 0, y: yOff },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          delay: i * 0.08, scrollTrigger: { trigger: el, start: 'top 88%' } }
      );
      if (!VP.hasPointer) return;
      const handleEnter = () => {
        gsap.to(num, { WebkitTextStroke: '1px var(--accent)', color: 'var(--accent)', duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(el,  { x: VP.x(0.005, 5, 9), duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        if (rule) gsap.to(rule, { width: '3rem', duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      };
      const handleLeave = () => {
        gsap.to(num, { WebkitTextStroke: '1px var(--gold-soft)', color: 'transparent', duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(el,  { x: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        if (rule) gsap.to(rule, { width: '0rem', duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      };
      el.addEventListener('mouseenter', handleEnter);
      el.addEventListener('mouseleave', handleLeave);
      el.addEventListener('focusin',  handleEnter);
      el.addEventListener('focusout', handleLeave);
      cleanupFns.push(() => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
        el.removeEventListener('focusin',  handleEnter);
        el.removeEventListener('focusout', handleLeave);
      });
    });

    const corridorWrap = rootRef.current.querySelector('.corridor-wrap');
    if (!corridorWrap) return;

    const routeSvg = corridorWrap.querySelector('.route-svg');
    const pathEl   = corridorWrap.querySelector('.route-path');
    const glowEl   = corridorWrap.querySelector('.route-path-glow');
    const baseEl   = corridorWrap.querySelector('.route-path-base');
    const chapters = Array.from(corridorWrap.querySelectorAll('.journey-chapter'));

    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
    const noMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!routeSvg || !pathEl || !glowEl || !baseEl || noMotion || chapters.length < 2) return;

    let currentProgress = 0;
    let draw            = null;
    let st              = null;
    let ro              = null;
    let initAborted     = false;

    const init = async () => {
      try { await document.fonts.ready; } catch (_) {}
      if (initAborted) return;
      await Promise.all(
        Array.from(corridorWrap.querySelectorAll('.chapter-img')).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(r => { img.onload = img.onerror = r; })
        )
      );
      if (initAborted) return;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (initAborted) return;
      if (!isDesktop()) return;
      ScrollTrigger.refresh();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (initAborted) return;
      draw = buildGeometry({ corridorWrap, routeSvg, pathEl, glowEl, baseEl, chapters, currentProgress });
      if (!draw) return;
      st = createScrollTrigger({ chapters, draw });
      currentProgress = st.progress;
      cleanupFns.push(() => st?.kill());
      const chapterCleanups = attachChapterAnimationsResponsive(chapters);
      cleanupFns.push(...chapterCleanups);
      if (typeof ResizeObserver !== 'undefined') {
        let resizeTimeout = null;
        ro = new ResizeObserver(() => {
          if (!draw) return;
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
              if (!isDesktop()) return;
              currentProgress = st?.progress ?? currentProgress;
              draw = buildGeometry({ corridorWrap, routeSvg, pathEl, glowEl, baseEl, chapters, currentProgress });
              if (!draw) return;
              st?.kill();
              st = createScrollTrigger({ chapters, draw });
              currentProgress = st.progress;
              ScrollTrigger.refresh();
            });
          }, 150);
        });
        ro.observe(corridorWrap);
        cleanupFns.push(() => {
          clearTimeout(resizeTimeout);
          ro.disconnect();
        });
      }
    };

    init();

    return () => {
      initAborted = true;
      cleanupFns.forEach(fn => fn());
    };
  }, { scope: rootRef });

  // ─── EXP CARDS / MAP PINS / TESTIMONIALS / CTA ───────────────────────────
  useGSAP(() => {
    rootRef.current.querySelectorAll('.exp-card').forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
          delay: i * 0.1, scrollTrigger: { trigger: el, start: 'top 90%' } }
      );
    });

    rootRef.current.querySelectorAll('.map-pin').forEach((el, i) => {
      gsap.fromTo(el,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)',
          delay: i * 0.05, scrollTrigger: { trigger: el.closest('.map-section'), start: 'top 75%' } }
      );
    });

    const testimonialBlock = rootRef.current.querySelector('.testimonial-block');
    if (testimonialBlock) {
      gsap.fromTo(testimonialBlock,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: testimonialBlock, start: 'top 80%' } }
      );
    }

    const ctaScene = rootRef.current.querySelector('.final-cta-scene');
    if (ctaScene) {
      gsap.fromTo(ctaScene,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: ctaScene, start: 'top 85%' } }
      );
    }
  }, { scope: rootRef });

  // ─── LUX INTERACTIONS ─────────────────────────────────────────────────────
  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (noMotion) return;

    const M = {
      micro:  { min: 3.0,  max: 8.0  },
      hover:  { fast: 0.35, mid: 0.45, slow: 0.55 },
      reveal: { fast: 0.8,  mid: 1.1,  slow: 1.4  },
      scene:  { fast: 1.2,  mid: 1.6,  slow: 2.0  },
    };

    const E = {
      entry:     'power4.out',
      exit:      'power3.in',
      settle:    'expo.out',
      spring:    'back.out(1.8)',
      cinematic: 'power3.inOut',
      ambient:   'sine.inOut',
    };

    const seed   = (i, salt = 0) => ((i * 2654435761 + salt * 40503) >>> 0) / 0xffffffff;
    const lerp   = (a, b, t) => a + (b - a) * t;
    const jitter = (i, salt, lo, hi) => lerp(lo, hi, seed(i, salt));

    const luxCleanups = [];

    // ── About intro scene ─────────────────────────────────────────────────
    (() => {
      const section = root.querySelector('#about');
      if (!section) return;
      const lineL = section.querySelector('.grow-line-wrap');

      const sceneTl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 72%', toggleActions: 'play none none none' },
        defaults: { ease: E.entry },
      });

      if (lineL) sceneTl.fromTo(lineL, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: M.reveal.fast, transformOrigin: 'left center' }, 0);

      const flyBeat = section.querySelector('.why-we-fly-beat');
      const flyRule = section.querySelector('.why-fly-rule');
      const flyMark = section.querySelector('.why-fly-mark');

      if (flyBeat) {
        const beatTl = gsap.timeline({
          scrollTrigger: { trigger: flyBeat, start: 'top 78%', toggleActions: 'play none none none' },
          defaults: { ease: E.entry },
        });
        if (flyRule) beatTl.fromTo(flyRule, { height: '0%', opacity: 0 }, { height: '100%', opacity: 1, duration: M.reveal.slow }, 0);
        if (flyMark) beatTl.fromTo(flyMark, { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: M.reveal.mid }, 0.2);
      }
    })();

    // ── Philosophy items ──────────────────────────────────────────────────
    (() => {
      const items = Array.from(root.querySelectorAll('.philosophy-item'));
      if (!items.length) return;
      items.forEach((el, i) => {
        const num   = el.querySelector('.philosophy-num');
        const icon  = el.querySelector('svg');
        const title = el.querySelector('.philosophy-title');
        const desc  = el.querySelector('p');
        const rule  = el.querySelector('.philosophy-rule');
        const yOff  = jitter(i, 1, 22, 55);
        const delay = jitter(i, 2, 0, 0.22);
        const dur   = jitter(i, 3, M.reveal.fast, M.reveal.slow);
        const itemTl = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none none' },
          defaults: { ease: E.entry },
        });
        if (num)   itemTl.fromTo(num,   { opacity: 0, y: yOff * 0.6 },              { opacity: 1, y: 0, duration: dur }, delay);
        if (icon)  itemTl.fromTo(icon,  { opacity: 0, scale: 0.82, y: yOff * 0.4 }, { opacity: 1, scale: 1, y: 0, duration: M.hover.slow, ease: E.spring }, delay + 0.1);
        if (title) itemTl.fromTo(title, { opacity: 0, y: yOff * 0.3 },              { opacity: 1, y: 0, duration: M.reveal.mid }, delay + 0.18);
        if (desc)  itemTl.fromTo(desc,  { opacity: 0, y: yOff * 0.2 },              { opacity: 1, y: 0, duration: M.reveal.fast }, delay + 0.28);
        if (icon) {
          gsap.to(icon, {
            scale: jitter(i, 5, 1.04, 1.09),
            duration: jitter(i, 6, M.micro.min + 0.5, M.micro.min + 3.5),
            ease: E.ambient, yoyo: true, repeat: -1,
            delay: delay + dur + jitter(i, 7, 0, 1.2),
            transformOrigin: 'center center',
          });
        }
        const handleEnter = () => {
          gsap.to(el,   { x: 10, duration: M.hover.mid, ease: E.settle, overwrite: 'auto' });
          if (num)  gsap.to(num,  { WebkitTextStroke: '1px var(--accent)', color: 'var(--accent)', duration: M.hover.mid, ease: E.settle, overwrite: 'auto' });
          if (icon) gsap.to(icon, { scale: 1.14, color: 'var(--accent)', duration: M.hover.fast, ease: E.spring, overwrite: 'auto' });
          if (rule) gsap.to(rule, { width: '3rem', duration: M.hover.mid, ease: E.settle, overwrite: 'auto' });
        };
        const handleLeave = () => {
          gsap.to(el,   { x: 0, duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
          if (num)  gsap.to(num,  { WebkitTextStroke: '1px var(--gold-soft)', color: 'transparent', duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
          if (icon) gsap.to(icon, { scale: 1, duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
          if (rule) gsap.to(rule, { width: '0rem', duration: M.hover.mid, ease: E.settle, overwrite: 'auto' });
        };
        el.addEventListener('mouseenter', handleEnter);
        el.addEventListener('mouseleave', handleLeave);
        el.addEventListener('focusin',    handleEnter);
        el.addEventListener('focusout',   handleLeave);
        luxCleanups.push(() => {
          el.removeEventListener('mouseenter', handleEnter);
          el.removeEventListener('mouseleave', handleLeave);
          el.removeEventListener('focusin',    handleEnter);
          el.removeEventListener('focusout',   handleLeave);
        });
      });
    })();

    // ── Manifesto quote parallax ──────────────────────────────────────────
    (() => {
      const quoteSection = root.querySelector('.manifesto-quote');
      if (!quoteSection) return;
      gsap.to(quoteSection, {
        backgroundPositionY: '8%',
        ease: 'none',
        scrollTrigger: { trigger: quoteSection, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
      });
    })();

    // ── Journey chapters ──────────────────────────────────────────────────
    (() => {
      const chapters = Array.from(root.querySelectorAll('.journey-chapter'));
      if (!chapters.length) return;

      chapters.forEach((ch, ci) => {
        const postcard = ch.querySelector('.chapter-postcard');
        const img      = ch.querySelector('.chapter-img');
        if (!postcard) return;
        const floatAmp = jitter(ci, 10, 2, 4.5);
        const floatDur = jitter(ci, 11, M.micro.min + 0.2, M.micro.min + 2.8);
        const floatDel = jitter(ci, 12, 0, 2.2);
        gsap.to(postcard, {
          y: `-=${floatAmp}`,
          duration: floatDur, ease: E.ambient, yoyo: true, repeat: -1, delay: floatDel,
        });
        let isTicking = false;
        const handleMove = (e) => {
          if (!isTicking) {
            window.requestAnimationFrame(() => {
              const rect = postcard.getBoundingClientRect();
              const cx   = (e.clientX - rect.left - rect.width  * 0.5) / (rect.width  * 0.5);
              const cy   = (e.clientY - rect.top  - rect.height * 0.5) / (rect.height * 0.5);
              if (img) gsap.to(img, { x: cx * -6, y: cy * -4, scale: 1.06, duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
              gsap.to(postcard, {
                rotateX: -cy * 3, rotateY: cx * 3,
                duration: M.hover.mid, ease: E.settle, overwrite: 'auto',
                transformPerspective: 900, transformOrigin: 'center center',
              });
              gsap.to(postcard, {
                boxShadow: `${cx * 6}px ${12 + Math.abs(cy) * 8}px ${32 + Math.abs(cy) * 24}px rgba(0,0,0,${0.14 + Math.abs(cy) * 0.1})`,
                duration: M.hover.mid, ease: E.settle, overwrite: false,
              });
              isTicking = false;
            });
            isTicking = true;
          }
        };
        const handleLeave = () => {
          if (img) gsap.to(img, { x: 0, y: 0, scale: 1, duration: M.reveal.fast, ease: E.settle, overwrite: 'auto' });
          gsap.to(postcard, {
            rotateX: 0, rotateY: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 18px rgba(0,0,0,0.08), 0 28px 48px -12px rgba(0,0,0,0.18)',
            duration: M.hover.slow, ease: E.settle, overwrite: 'auto',
          });
        };
        postcard.style.willChange = 'transform';
        postcard.addEventListener('mousemove',  handleMove);
        postcard.addEventListener('mouseleave', handleLeave);
        luxCleanups.push(() => {
          postcard.removeEventListener('mousemove',  handleMove);
          postcard.removeEventListener('mouseleave', handleLeave);
        });
      });

      chapters.forEach(ch => {
        const btn  = ch.querySelector('.chapter-btn');
        const icon = btn?.querySelector('svg');
        if (!btn) return;
        const handleEnter = () => {
          gsap.to(btn,  { scale: 1.03, duration: M.hover.fast, ease: 'back.out(2.2)', overwrite: 'auto' });
          if (icon) gsap.to(icon, { x: 4, duration: M.hover.mid, ease: E.entry, overwrite: 'auto' });
        };
        const handleLeave = () => {
          gsap.to(btn,  { scale: 1, duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
          if (icon) gsap.to(icon, { x: 0, duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
        };
        const handleDown = () => gsap.to(btn, { scale: 0.97, duration: 0.12, ease: 'power2.in', overwrite: 'auto' });
        const handleUp   = () => {
          gsap.to(btn, { scale: 1.04, duration: 0.22, ease: 'back.out(3)', overwrite: 'auto' });
          setTimeout(() => gsap.to(btn, { scale: 1, duration: M.hover.mid, ease: E.settle, overwrite: 'auto' }), 180);
        };
        btn.addEventListener('mouseenter',  handleEnter);
        btn.addEventListener('mouseleave',  handleLeave);
        btn.addEventListener('mousedown',   handleDown);
        btn.addEventListener('mouseup',     handleUp);
        luxCleanups.push(() => {
          btn.removeEventListener('mouseenter',  handleEnter);
          btn.removeEventListener('mouseleave',  handleLeave);
          btn.removeEventListener('mousedown',   handleDown);
          btn.removeEventListener('mouseup',     handleUp);
        });
      });

      let luxActiveIdx = -1;
      const chapterObserver = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          if (m.type !== 'attributes' || m.attributeName !== 'class') return;
          const ch          = m.target;
          const isNowActive = ch.classList.contains('chapter-active');
          const chIdx       = chapters.indexOf(ch);
          if (chIdx === -1) return;
          if (isNowActive && chIdx !== luxActiveIdx) {
            luxActiveIdx = chIdx;
            const num  = ch.querySelector('.chapter-num');
            const btn  = ch.querySelector('.chapter-btn');
            const card = ch.querySelector('.chapter-postcard');
            const img  = ch.querySelector('.chapter-img');
            const arrivalTl = gsap.timeline({ defaults: { ease: E.settle } });
            if (img)  arrivalTl.to(img,  { filter: 'saturate(1.4) brightness(1.12)', duration: M.hover.fast }, 0);
            if (img)  arrivalTl.to(img,  { filter: 'saturate(1.22) brightness(1.05)', duration: M.reveal.mid }, M.hover.fast);
            if (num)  arrivalTl.to(num,  { WebkitTextStroke: '1px var(--accent)', duration: M.hover.slow, ease: E.entry }, 0.05);
            if (card) arrivalTl.to(card, { boxShadow: '0 6px 12px rgba(0,0,0,0.07), 0 20px 40px rgba(0,0,0,0.14), 0 48px 72px -10px rgba(0,0,0,0.28)', y: -4, duration: M.reveal.mid, ease: E.spring }, 0.1);
            if (btn)  arrivalTl.to(btn,  { borderColor: 'var(--accent)', color: 'var(--accent)', duration: M.hover.slow }, 0.18);
          } else if (!isNowActive) {
            const num  = ch.querySelector('.chapter-num');
            const btn  = ch.querySelector('.chapter-btn');
            const card = ch.querySelector('.chapter-postcard');
            const departureTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            if (num)  departureTl.to(num,  { WebkitTextStroke: '1px var(--gold-soft)', duration: M.hover.slow }, 0);
            if (btn)  departureTl.to(btn,  { borderColor: 'var(--line)', color: 'var(--ink)', duration: M.hover.mid }, 0);
            if (card) departureTl.to(card, { boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 18px rgba(0,0,0,0.08), 0 28px 48px -12px rgba(0,0,0,0.18)', y: 0, duration: M.hover.slow }, 0);
          }
        });
      });
      chapters.forEach(ch => chapterObserver.observe(ch, { attributes: true, attributeFilter: ['class'] }));
      luxCleanups.push(() => chapterObserver.disconnect());
    })();

    // ── Map pins ──────────────────────────────────────────────────────────
    (() => {
      const pins = Array.from(root.querySelectorAll('.map-pin'));
      if (!pins.length) return;
      pins.forEach((el, i) => {
        const dot   = el.querySelector('span:first-child');
        const label = el.querySelector('span:last-child');
        const popDur     = jitter(i, 20, 0.24, 0.34);
        const entryDelay = i * jitter(i, 21, 0.055, 0.09);
        const entryTl = gsap.timeline({
          delay: entryDelay,
          scrollTrigger: { trigger: el.closest('.map-section'), start: 'top 78%' },
        });
        entryTl
          .fromTo(el, { scale: 0, opacity: 0, y: 6 }, { scale: 1.28, opacity: 1, y: 0, duration: popDur, ease: E.entry })
          .to(el, { scale: 0.86, duration: popDur * 0.55, ease: 'power2.in' })
          .to(el, { scale: 1.0,  duration: popDur * 0.75, ease: E.spring });
        if (label) entryTl.fromTo(label, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: M.hover.mid, ease: E.settle }, '-=0.15');
        if (dot) {
          const pulseDur = jitter(i, 22, 1.0, 2.0);
          const pulseDel = entryDelay + popDur * 2 + jitter(i, 23, 0, 1.5);
          ScrollTrigger.create({ trigger: el.closest('.map-section'), start: 'top 78%', once: true,
            onEnter: () => {
              gsap.to(dot, {
                scale: jitter(i, 24, 1.4, 1.7), opacity: jitter(i, 25, 0.45, 0.65),
                duration: pulseDur, ease: E.ambient, yoyo: true, repeat: -1,
                delay: pulseDel, transformOrigin: 'center center',
              });
            }
          });
        }
      });
    })();

    // ── Testimonials ──────────────────────────────────────────────────────
    (() => {
      const section   = root.querySelector('.testimonial-section');
      if (!section) return;
      const block     = section.querySelector('.testimonial-block');
      const quoteIco  = block?.querySelector('svg');
      const photoWrap = block?.querySelector('.w-12.h-12');
      const gridItems = Array.from(block?.querySelectorAll('.grid > div') ?? []);
      const arrows    = Array.from(section.querySelectorAll('button'));
      if (!block) return;
      const sceneTl = gsap.timeline({
        scrollTrigger: { trigger: block, start: 'top 80%', toggleActions: 'play none none none' },
        defaults: { ease: E.entry },
      });
      if (quoteIco)  sceneTl.fromTo(quoteIco,  { opacity: 0, y: -8, scale: 0.8 },   { opacity: 1, y: 0, scale: 1, duration: M.reveal.mid, ease: E.spring }, 0.1);
      if (photoWrap) sceneTl.fromTo(photoWrap, { opacity: 0, x: -18, scale: 0.85 }, { opacity: 1, x: 0, scale: 1, duration: M.reveal.mid, ease: E.spring }, 0.52);
      gridItems.forEach((item, i) => {
        sceneTl.fromTo(item,
          { opacity: 0, scale: 0.86, y: jitter(i, 30, 10, 20) },
          { opacity: 1, scale: 1, y: 0, duration: M.reveal.mid, ease: E.spring },
          0.18 + i * jitter(i, 31, 0.08, 0.14)
        );
      });
      if (quoteIco) {
        gsap.to(quoteIco, {
          y: jitter(0, 32, -2.5, -4),
          duration: jitter(0, 33, M.micro.min + 1, M.micro.min + 3),
          ease: E.ambient, yoyo: true, repeat: -1, delay: M.reveal.slow,
        });
      }
      arrows.forEach((btn, i) => {
        const icon = btn.querySelector('svg');
        const dir  = i === 0 ? -1 : 1;
        const handleEnter = () => {
          gsap.to(btn,  { scale: 1.14, borderColor: 'var(--accent)', duration: M.hover.fast, ease: 'back.out(2.4)', overwrite: 'auto' });
          if (icon) gsap.to(icon, { x: dir * 4, duration: M.hover.mid, ease: E.entry, overwrite: 'auto' });
        };
        const handleLeave = () => {
          gsap.to(btn,  { scale: 1, borderColor: 'var(--line)', duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
          if (icon) gsap.to(icon, { x: 0, duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
        };
        const handleDown = () => gsap.to(btn, { scale: 0.94, duration: 0.1, ease: 'power2.in', overwrite: 'auto' });
        const handleUp   = () => gsap.to(btn, { scale: 1, duration: M.hover.mid, ease: 'back.out(3)', overwrite: 'auto' });
        btn.addEventListener('mouseenter',  handleEnter);
        btn.addEventListener('mouseleave',  handleLeave);
        btn.addEventListener('mousedown',   handleDown);
        btn.addEventListener('mouseup',     handleUp);
        luxCleanups.push(() => {
          btn.removeEventListener('mouseenter',  handleEnter);
          btn.removeEventListener('mouseleave',  handleLeave);
          btn.removeEventListener('mousedown',   handleDown);
          btn.removeEventListener('mouseup',     handleUp);
        });
      });
    })();

    // ── Contact ───────────────────────────────────────────────────────────
    (() => {
      const formCard = root.querySelector('.form-card') ?? null;
      if (formCard) {
        const fields = Array.from(formCard.querySelectorAll('.flex.flex-col.gap-2'));
        gsap.fromTo(fields,
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: M.reveal.fast, ease: E.entry,
            stagger: { each: jitter(0, 41, 0.06, 0.09) },
            scrollTrigger: { trigger: formCard, start: 'top 84%' },
          }
        );
      }
      root.querySelectorAll('.contact-input').forEach(input => {
        const handleFocus = () => gsap.to(input, { y: -3, duration: M.hover.fast, ease: E.entry, overwrite: 'auto' });
        const handleBlur  = () => gsap.to(input, { y: 0,  duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
        input.addEventListener('focus', handleFocus);
        input.addEventListener('blur',  handleBlur);
        luxCleanups.push(() => {
          input.removeEventListener('focus', handleFocus);
          input.removeEventListener('blur',  handleBlur);
        });
      });
      const submitBtn = root.querySelector('.contact-submit-btn');
      if (submitBtn) {
        const icon = submitBtn.querySelector('svg');
        let isTickingBtn = false;
        const handleMove = (e) => {
          if (!isTickingBtn) {
            window.requestAnimationFrame(() => {
              const rect = submitBtn.getBoundingClientRect();
              const cx   = (e.clientX - rect.left - rect.width  * 0.5) * 0.14;
              const cy   = (e.clientY - rect.top  - rect.height * 0.5) * 0.14;
              gsap.to(submitBtn, { x: cx, y: cy, duration: M.hover.mid, ease: E.entry, overwrite: 'auto' });
              if (icon) gsap.to(icon, { x: 4, duration: M.hover.mid, ease: E.entry, overwrite: 'auto' });
              isTickingBtn = false;
            });
            isTickingBtn = true;
          }
        };
        const handleLeave = () => {
          gsap.to(submitBtn, { x: 0, y: 0, duration: M.reveal.fast, ease: E.settle, overwrite: 'auto' });
          if (icon) gsap.to(icon, { x: 0, duration: M.hover.slow, ease: E.settle, overwrite: 'auto' });
        };
        const handleDown = () => gsap.to(submitBtn, { scale: 0.97, duration: 0.12, ease: 'power2.in', overwrite: 'auto' });
        const handleUp   = () => {
          gsap.to(submitBtn, { scale: 1.03, duration: 0.2, ease: 'back.out(2)', overwrite: 'auto' });
          setTimeout(() => gsap.to(submitBtn, { scale: 1, duration: M.hover.mid, ease: E.settle, overwrite: 'auto' }), 150);
        };
        submitBtn.addEventListener('mousemove',  handleMove);
        submitBtn.addEventListener('mouseleave', handleLeave);
        submitBtn.addEventListener('mousedown',  handleDown);
        submitBtn.addEventListener('mouseup',    handleUp);
        luxCleanups.push(() => {
          submitBtn.removeEventListener('mousemove',  handleMove);
          submitBtn.removeEventListener('mouseleave', handleLeave);
          submitBtn.removeEventListener('mousedown',  handleDown);
          submitBtn.removeEventListener('mouseup',    handleUp);
        });
      }
    })();

    // ── Footer ────────────────────────────────────────────────────────────
    (() => {
      const footer = root.querySelector('footer');
      if (!footer) return;
      const brand = footer.querySelector('[data-text-eyebrow]');
      if (brand) {
        ScrollTrigger.create({ trigger: footer, start: 'top bottom', once: true,
          onEnter: () => {
            gsap.to(brand, {
              opacity: 0.6,
              duration: jitter(0, 50, M.micro.min + 1, M.micro.min + 4),
              ease: E.ambient, yoyo: true, repeat: -1, delay: 0.8,
            });
          }
        });
      }
      footer.querySelectorAll('a').forEach((link) => {
        link.style.position           = 'relative';
        link.style.display            = 'inline-block';
        link.style.backgroundImage    = 'linear-gradient(var(--accent), var(--accent))';
        link.style.backgroundRepeat   = 'no-repeat';
        link.style.backgroundPosition = 'left bottom 0px';
        link.style.backgroundSize     = '0% 1px';
        const handleEnter = (e) => {
          window.requestAnimationFrame(() => {
            const rect     = link.getBoundingClientRect();
            const fromLeft = e.clientX < rect.left + rect.width * 0.5;
            gsap.set(link, { backgroundPositionX: fromLeft ? '0%' : '100%' });
            gsap.to(link, { backgroundSize: '100% 1px', duration: M.hover.mid, ease: E.settle, overwrite: 'auto' });
          });
        };
        const handleLeave = () => gsap.to(link, { backgroundSize: '0% 1px', duration: M.hover.fast, ease: E.exit, overwrite: 'auto' });
        link.addEventListener('mouseenter', handleEnter);
        link.addEventListener('mouseleave', handleLeave);
        luxCleanups.push(() => {
          link.removeEventListener('mouseenter', handleEnter);
          link.removeEventListener('mouseleave', handleLeave);
        });
      });
    })();

    // ── Grow lines ────────────────────────────────────────────────────────
    root.querySelectorAll('.grow-line-right').forEach(el => {
      if (el.dataset.lineReady) return;
      el.dataset.lineReady = '1';
      gsap.fromTo(el,
        { width: '0px', opacity: 0 },
        {
          width: '2.5rem', opacity: 1,
          duration: 0.8, ease: 'power2.out',
          scrollTrigger: {
            trigger: el, start: 'top 90%',
            toggleActions: 'play none none none', once: true,
          },
        }
      );
    });

    return () => luxCleanups.forEach(fn => fn());

  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="relative w-full" style={{ background: 'var(--bg)' }}>

      <section id="about" className="px-6 sm:px-16 lg:px-24 py-28 lg:py-40">
        <div className="manifesto-intro max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="grow-line-wrap h-[1px] w-10">
              <span className="grow-line" style={{ background: 'var(--accent)' }} />
              <span className="grow-line-glow" />
            </div>
            <span data-text-eyebrow className="display-font italic text-[var(--accent)] text-sm tracking-widest">ABOUT Navigator</span>
            <div className="grow-line-right h-[1px]" style={{ width: 0, background: 'var(--accent)' }} />
          </div>
          <p data-text-heading className="display-font text-[clamp(2.6rem,7vw,6rem)] font-light leading-[1.08] text-[var(--ink)]">
            The world was never meant to be seen <span className="italic">through a screen.</span>
          </p>
          <p data-text-body className="text-sm font-light leading-7 text-[var(--ink-soft)] max-w-md">
            Navigator was founded on one conviction — that the rarest experiences are the ones lived, not scrolled past. Every journey we design carries that belief from first inquiry to final farewell.
          </p>
        </div>

        <div className="manifesto-media-wrap relative w-full aspect-[16/9] lg:aspect-[21/9] overflow-hidden mt-24 lg:mt-32">
          <video
            src="/video/vid2.mp4"
            className="manifesto-media-img w-full h-full object-cover"
            autoPlay muted loop playsInline preload="none"
            aria-hidden="true" tabIndex={-1}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,8,6,0.05) 0%, rgba(10,8,6,0.18) 100%)' }} />
        </div>

        <div className="why-we-fly-beat grid grid-cols-1 lg:grid-cols-12 gap-8 mt-28 lg:mt-44">
          <div className="lg:col-span-1 flex lg:flex-col items-center lg:items-start gap-4">
            <span className="why-fly-mark eyebrow text-[var(--accent)]">II.</span>
            <span className="why-fly-rule hidden lg:block w-[1px] flex-1" style={{ background: 'var(--line)' }} />
          </div>
          <div className="lg:col-span-8 lg:col-start-3 flex flex-col gap-6">
            <p data-text-eyebrow className="eyebrow text-[var(--ink-faint)]">Why We Fly</p>
            <p data-text-heading className="display-font text-[clamp(2rem,5vw,4rem)] font-light italic leading-[1.15] text-[var(--ink)]">
              Some destinations are discovered. <span style={{ color: 'var(--accent)' }}>Others are felt.</span>
            </p>
            <p data-text-body className="text-sm font-light leading-7 text-[var(--ink-soft)] max-w-md">
              A skyline at dusk, the hush before a temple gate, salt air through an open window — these are not itineraries. They are the reason we still believe in travel.
            </p>
          </div>
        </div>

        <div className="philosophy-list mt-24 lg:mt-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-b" style={{ borderColor: 'var(--line)' }}>
            {[
              { num: '01', icon: Sparkles, title: 'Curated Experiences', desc: 'Every itinerary is composed, never templated — built around what moves you.' },
              { num: '02', icon: KeyRound, title: 'Private Access',      desc: 'Doors that stay closed to the public open quietly, simply because we ask.' },
              { num: '03', icon: Compass,  title: 'Seamless Journeys',   desc: 'Every transfer, stay, and arrival timed so the only thing you notice is the view.' },
              { num: '04', icon: Headset,  title: 'Personal Concierge',  desc: 'One dedicated voice, available before, during, and long after you return.' },
            ].map((item) => (
              <div
                key={item.num}
                tabIndex={0}
                className="philosophy-item group relative h-full flex flex-col items-start gap-4 px-0 md:px-8 lg:px-10 py-9 lg:py-11 border-t first:border-t-0 md:border-t-0 md:border-r md:last:border-r-0 border-[var(--line)] cursor-default outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <span className="philosophy-num display-font font-light leading-none shrink-0 transition-colors duration-500"
                  style={{ fontSize: 'clamp(2.4rem,4vw,3.4rem)', color: 'transparent', WebkitTextStroke: '1px var(--gold-soft)' }}>
                  {item.num}
                </span>
                <item.icon size={26} strokeWidth={1.25} className="text-[var(--accent)] shrink-0" />
                <div className="flex flex-col gap-2">
                  <h3 className="philosophy-title display-font text-[clamp(1.5rem,2.4vw,2.1rem)] font-light text-[var(--ink)] leading-tight">{item.title}</h3>
                  <p className="text-sm text-[var(--ink-soft)] leading-7 font-light">{item.desc}</p>
                </div>
                <span className="philosophy-rule h-[1px] shrink-0" style={{ width: 0, background: 'var(--accent)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-rule mx-6 sm:mx-16 lg:mx-24" />

      <section className="manifesto-quote px-6 sm:px-16 lg:px-24 py-28 lg:py-44 text-center">
        <p data-text-heading className="display-font text-[clamp(2.2rem,6vw,5rem)] font-light italic leading-[1.15] text-[var(--ink)] max-w-4xl mx-auto">
          We don&apos;t sell trips. <span style={{ color: 'var(--accent)' }}>We design memories.</span>
        </p>
      </section>

      <div className="h-rule mx-6 sm:mx-16 lg:mx-24" />

      <section id="destinations" className="relative">
        <div className="relative z-20 px-6 sm:px-16 lg:px-24 py-24 lg:py-32" style={{ background: 'var(--bg)' }}>
          <div className="flex items-end justify-between">
            <div>
              <p data-text-eyebrow className="eyebrow text-[var(--accent)] mb-4">Where to next</p>
              <h2 data-text-heading className="display-font text-[clamp(2rem,4.5vw,3.5rem)] font-light text-[var(--ink)] leading-none">Iconic Destinations</h2>
            </div>
            <Link href="/destinations" data-text-body className="hidden lg:flex items-center gap-3 eyebrow text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors group">
              <span>View all</span>
              <span className="inline-block w-6 h-[1px] bg-[var(--line)] group-hover:w-10 group-hover:bg-[var(--accent)] transition-all duration-400" />
            </Link>
          </div>
        </div>

        <div className="corridor-wrap relative px-6 sm:px-16 lg:px-24 pb-10">
          <svg
            className="route-svg hidden lg:block"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
          >
            <defs>
              <filter id="routeGlow" x="-50%" y="-20%" width="200%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="1.5 0.2 0 0 0.10 0.3 0.2 0 0 0.03 0 0 0 0 0 0 0 0 1.4 0" />
              </filter>
            </defs>
            <path className="route-path-base" fill="none" stroke="#FF8A2A" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.07" style={{ willChange: 'stroke-dashoffset' }} />
            <path className="route-path-glow" fill="none" stroke="#FF8A2A" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.12" style={{ filter: 'url(#routeGlow)', willChange: 'stroke-dashoffset' }} />
            <path className="route-path"      fill="none" stroke="#FF8A2A" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="1"    style={{ willChange: 'stroke-dashoffset' }} />
          </svg>

          {[...featuredDestinations, ...secondaryDestinations].map((d, i) => {
            const reversed = i % 2 !== 0;
            return (
              <div
                key={d.name}
                className="journey-chapter relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-16 lg:py-24"
                data-side={reversed ? 'right' : 'left'}
              >
                <div className={`chapter-copy flex-1 flex flex-col gap-4 ${reversed ? 'lg:order-2 lg:items-end lg:text-right' : 'lg:order-1'}`}>
                  <span className="chapter-num display-font font-light leading-none select-none"
                    style={{ fontSize: 'clamp(3.2rem,6.5vw,5.6rem)', color: 'transparent', WebkitTextStroke: '1px var(--gold-soft)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span data-text-eyebrow className="eyebrow" style={{ color: '#bd8c3f' }}>{d.tag} · {d.region}</span>
                  <h3
                    data-text-heading
                    className={`chapter-title display-font text-[clamp(2.2rem,4.8vw,4rem)] font-light leading-[0.95] text-[var(--ink)] inline-flex items-center gap-4 ${reversed ? 'lg:flex-row-reverse' : ''}`}
                  >
                    <span>{d.name}</span>
                  </h3>
                  <p data-text-body className="text-sm text-[var(--ink-soft)] leading-7 font-light max-w-sm">{d.desc}</p>
                  <button className={`chapter-btn btn-ui-cta mt-2 border border-[var(--line)] text-[var(--ink)] text-[11px] tracking-[0.15em] uppercase font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] self-start ${reversed ? 'lg:self-end' : ''}`}>
                    Explore Destination <ArrowUpRight size={16} />
                  </button>
                </div>
                <div
                  tabIndex={0}
                  className={`chapter-postcard relative w-[210px] sm:w-[250px] lg:w-[280px] aspect-[4/5] overflow-hidden rounded-sm shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${reversed ? 'lg:order-1' : 'lg:order-2'}`}
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 18px rgba(0,0,0,0.08), 0 28px 48px -12px rgba(0,0,0,0.18)' }}
                >
                  <Image src={d.img} alt={d.name} fill sizes="(max-width: 768px) 100vw, 33vw" loading="lazy" className="chapter-img object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.22) 100%)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="h-rule mx-6 sm:mx-16 lg:mx-24" />

      <section className="map-section px-6 sm:px-16 lg:px-24 py-24 lg:py-32">
        <div className="mb-14">
          <p data-text-eyebrow className="eyebrow text-[var(--accent)] mb-4">Where we go</p>
          <h2 data-text-heading className="display-font text-[clamp(2rem,4.5vw,3.5rem)] font-light text-[var(--ink)] leading-none">On the Map</h2>
        </div>
        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-sm overflow-hidden" style={{ background: 'var(--bg-soft)', border: '1px solid var(--line)' }}>
          <Image src="https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg" alt="World map" fill sizes="100vw" loading="lazy" className="object-cover opacity-30" />
          {mapPins.map((p, i) => (
            <div key={`${p.label}-${i}`} className="map-pin absolute flex flex-col items-center" style={{ top: p.top, left: p.left, transform: 'translate(-50%, -50%)' }}>
              <span className="block w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="eyebrow mt-2 text-[var(--ink)] whitespace-nowrap">{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="h-rule mx-6 sm:mx-16 lg:mx-24" />

      <section className="testimonial-section px-6 sm:px-16 lg:px-24 py-24 lg:py-36" style={{ background: 'var(--bg-soft)' }}>
        <div className="testimonial-block grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-8">
            <p data-text-eyebrow className="eyebrow text-[var(--accent)] mb-6">Travelers love Navigator</p>
            <Quote size={36} strokeWidth={1} className="text-[var(--accent-soft)] mb-6" />
            <p data-text-heading className="display-font text-[clamp(1.8rem,4vw,3.2rem)] font-light leading-[1.3] text-[var(--ink)] italic">
              &ldquo;{testimonials[0].quote}&rdquo;
            </p>
            <div className="mt-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <Image src={testimonials[0].img} alt={testimonials[0].name} width={100} height={100} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div>
                <p data-text-eyebrow className="eyebrow text-[var(--ink)]">{testimonials[0].name}</p>
                <p data-text-body className="text-xs text-[var(--ink-faint)] mt-1">{testimonials[0].location}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3">
              {featuredDestinations.slice(0, 4).map((d) => (
                <div key={d.name} className="aspect-square overflow-hidden rounded-sm">
                  <Image src={d.img} alt={d.name} fill loading="lazy" sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button aria-label="Previous Slide" className="btn-ui-icon border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <ChevronLeft size={18} />
              </button>
              <button aria-label="Next Slide" className="btn-ui-icon border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <ConciergeSection />

      <footer className="px-6 sm:px-16 lg:px-24 py-16 lg:py-20 border-t border-[var(--line)]">
        <div className="flex flex-col gap-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span data-text-eyebrow className="display-font italic text-[var(--ink)] text-2xl lg:text-3xl tracking-widest">Navigator</span>
              <p data-text-body className="text-xs text-[var(--ink-soft)] leading-6 font-light max-w-xs">Extraordinary journeys to the world&apos;s most remarkable places — crafted with care, from first inquiry to final farewell.</p>
            </div>
            <div className="flex flex-col gap-3">
              <span data-text-eyebrow className="eyebrow text-[var(--ink-faint)]">Destinations</span>
              {featuredDestinations.map(d => (
                <a key={d.name} href="#destinations" className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">{d.name}</a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span data-text-eyebrow className="eyebrow text-[var(--ink-faint)]">Explore</span>
              <a href="#destinations" className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">Destinations</a>
              <a href="#experiences"  className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">Experiences</a>
              <a href="#about"        className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">About</a>
              <a href="#"             className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">Journal</a>
            </div>
            <div className="flex flex-col gap-3">
              <span data-text-eyebrow className="eyebrow text-[var(--ink-faint)]">Contact</span>
              <a href="tel:+18004674966"                   className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">+962 7 9222 7711</a>
              <a href="mailto:info@navigatortravel-jo.com" className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors">info@navigatortravel-jo.com</a>
            </div>
          </div>
          <div className="h-rule" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-[10px] text-[var(--ink-faint)] tracking-widest uppercase">© 2025 Navigator Travel. All experiences reserved.</p>
            <div className="flex items-center gap-5 text-[10px] text-[var(--ink-faint)] tracking-widest uppercase">
              <a href="#" className="hover:text-[var(--accent)] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[var(--accent)] transition-colors">Terms</a>
              <a href="#" className="hover:text-[var(--accent)] transition-colors">Sustainability</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default About;