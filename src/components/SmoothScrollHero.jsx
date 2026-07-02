"use client";

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { ChevronDown } from 'lucide-react';

import outerImage from "@/assets/images/outerImage.webp";
import shadowImage from "@/assets/images/shadowImage.webp";
import skyImage from "@/assets/images/skyImage.webp";
import cloudsImage from "@/assets/images/cloudsImage.webp";
import aboveImage from "@/assets/images/aboveImage.webp";

import Navbar from './Navbar';
import dynamic from 'next/dynamic';

const About = dynamic(() => import('./About'));
import Loader from './Loader';

const setTheme = (light) => {
  document.body.classList.toggle('theme-light', light);
};

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollHero = () => {
  const scopeRef = useRef(null);
  const mainContainer = useRef(null);
  const windowRef = useRef(null);
  const shadowRef = useRef(null);
  const contentRef = useRef(null);
  const secondSectionRef = useRef(null);
  const paragraphRef = useRef(null);
  const cloudsRef = useRef(null);
  const innerVideoRef = useRef(null);
  const revealRef = useRef(null);
  const wordmarkRef = useRef(null);
  const horizonFadeRef = useRef(null);
  const skyRef = useRef(null);
  const cloudLayerRef = useRef(null);
  const cloudFarRef = useRef(null);
  const cloudMidRef = useRef(null);
  const cloudNearRef = useRef(null);
  const [loaderDone, setLoaderDone] = useState(false);

  // Entrance: fade in after short delay
  useEffect(() => {
    const t = setTimeout(() => {
      gsap.to(revealRef.current, { opacity: 1, duration: 1.8, ease: "power2.out" });
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Defensive autoplay — some browsers (notably Safari) only honor autoplay
  // reliably when muted is also set imperatively before play() is called.
  useEffect(() => {
    const v = innerVideoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  useGSAP(() => {
    let mm = gsap.matchMedia();

    // Only animate hero words on desktop (since they are hidden on mobile)
    mm.add("(min-width: 768px)", () => {
      // Hero word chars entrance — mask reveal + blur-to-sharp
      const heroWords = scopeRef.current.querySelectorAll('.hero-word');
      gsap.set(heroWords, { y: '110%', filter: 'blur(10px)' });
      gsap.to(heroWords, {
        y: '0%',
        filter: 'blur(0px)',
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.07,
        delay: 0.2,
      });
    });

    // Wordmark fade — blur-to-sharp, matching the hero copy
    gsap.from(wordmarkRef.current, {
      opacity: 0, y: -20, filter: 'blur(8px)',
      duration: 1.2, ease: "power3.out", delay: 0.1
    });

    // ─── MAIN SCROLL TIMELINE (window zoom-through) ───────────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: mainContainer.current,
        start: "top top",
        end: "+=270%",
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
      }
    });

    // 1. Zoom the window frame — user travels through it (original proportions/composition preserved)
    tl.to(windowRef.current, {
      scale: 5.5,
      rotation: 0.01,
      force3D: true,
      duration: 10,
      ease: "power2.in",
    }, 0);

    // 2. Hero text fades & scales out
    tl.to(contentRef.current, {
      scale: 4.5,
      opacity: 0,
      duration: 7,
      ease: "power2.in",
    }, 0);
    // 3. Scroll indicator vanishes early
    tl.to(".scroll-indicator", { opacity: 0, duration: 1 }, 0);

    // 4. Wordmark travels up — lands at navbar row center
    //    py-6 (24px) on mobile, py-7 (28px) on lg; logo half-height from live DOM
    const navPadding   = window.innerWidth >= 1024 ? 28 : 24;
    const logoHalfH    = wordmarkRef.current
      ? wordmarkRef.current.getBoundingClientRect().height / 2
      : 20;
    const navbarCenter = navPadding + logoHalfH;
    const logoY        = -(window.innerHeight / 2 - navbarCenter);
    const logoScale    = window.innerWidth < 480
      ? 0.70
      : window.innerWidth < 1024
        ? 0.62
        : 0.58;
    tl.to(wordmarkRef.current, {
      y: logoY,
      scale: logoScale,
      duration: 8,
      ease: "power2.inOut",
    }, 1.5);

    // 5. "About" section rises into view from below
    tl.fromTo(secondSectionRef.current,
      { opacity: 0, y: 160, scale: 0.88, filter: "blur(12px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 7, ease: "power3.out" },
      9
    );

    // 5b. Per-word reveal integrated into the main timeline via quickSetter.
    //     Each word gets its own 0→1 tween slotted sequentially into tl
    //     during the window where secondSection is on screen (tl labels 9→16).
    //     quickSetter owns every CSS write — no inline style assignments.
   if (paragraphRef.current) {
      const split = new SplitType(paragraphRef.current, { types: "words, chars" });
      const chars = split.chars;

      const REVEAL_START    = 9.5;
      const REVEAL_END      = 15.5;
      const totalRange      = REVEAL_END - REVEAL_START;
      const N               = chars.length;
      
      // التأكد من وجود أحرف لتجنب أخطاء العمليات الحسابية
      if (N > 0) {
        const charDuration = (totalRange / N) * 4;

        chars.forEach((c, i) => {
          const progressRatio = N > 1 ? i / (N - 1) : 0;
          const startTime = REVEAL_START + progressRatio * (totalRange - charDuration);

          // استخدام fromTo يجبر التايم لاين على الاحتفاظ بحالة الاختفاء تماماً
       // هنا يكمن السر: نبدأ بشفافية 15% (مثل أكسيوم) بدلاً من 0% ليظهر كإضاءة تمر على النص
          tl.fromTo(c, 
            { opacity: 0.15 },
            {
              opacity: 1,
              duration: charDuration,
              ease: "none"
            }, 
            startTime
          );
        });
      }
    }

    // 6. Switch nav/wordmark theme to light once cream content takes over
    let isThemeLight = false;

    ScrollTrigger.create({
      trigger: mainContainer.current,
      start: "top top",
      end: "+=270%",
      onUpdate: (self) => {
        const shouldBeLight = self.progress > 0.82;
        if (isThemeLight !== shouldBeLight) {
          isThemeLight = shouldBeLight;
          setTheme(isThemeLight);
        }
      },
      onLeaveBack: () => {
        if (isThemeLight) {
          isThemeLight = false;
          setTheme(false);
        }
      },
    });

    // ─── CLOUD LOOP — three depth layers, independent speeds ──────────────
    gsap.fromTo(
      cloudsRef.current,
      { xPercent: 0 },
      { xPercent: -50, duration: 35, repeat: -1, ease: "none" }
    );

  gsap.fromTo(cloudFarRef.current, 
      { backgroundPositionX: '0vw' }, 
      { backgroundPositionX: '-600vw', duration: 70, repeat: -1, ease: "none" }
    );
    gsap.to(cloudFarRef.current, {
      y: 14, duration: 9, ease: "sine.inOut", repeat: -1, yoyo: true
    });

    gsap.fromTo(cloudMidRef.current,
      { xPercent: 0 },
      { xPercent: -50, duration: 45, repeat: -1, ease: "none" }
    );
    gsap.to(cloudMidRef.current, {
      y: 22, duration: 7, ease: "sine.inOut", repeat: -1, yoyo: true
    });

    gsap.fromTo(cloudNearRef.current,
      { xPercent: 0 },
      { xPercent: -50, duration: 24, repeat: -1, ease: "none" }
    );
    gsap.to(cloudNearRef.current, {
      y: 30, duration: 5.5, ease: "sine.inOut", repeat: -1, yoyo: true
    });

    // Parallax depth on scroll — far layer drifts slowest, near fastest
    gsap.to(cloudFarRef.current, {
      yPercent: -6, ease: "none",
      scrollTrigger: { trigger: mainContainer.current, start: "top top", end: "+=270%", scrub: 1.2 }
    });
    gsap.to(cloudMidRef.current, {
      yPercent: -14, ease: "none",
      scrollTrigger: { trigger: mainContainer.current, start: "top top", end: "+=270%", scrub: 1.2 }
    });
    gsap.to(cloudNearRef.current, {
      yPercent: -26, ease: "none",
      scrollTrigger: { trigger: mainContainer.current, start: "top top", end: "+=270%", scrub: 1.2 }
    });

    // ─── Sky/clouds fade out as the cream "About" content rises in ───────
    gsap.to([skyRef.current, cloudLayerRef.current], {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: mainContainer.current,
        start: "top top",
        end: "+=270%",
        scrub: 1.2,
      }
    });

    // ─── Cinematic entrance: window frame settles into view with subtle depth ──
    gsap.fromTo(windowRef.current,
      { scale: 1.04, opacity: 0.85, filter: "blur(4px)" },
      { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.8, ease: "power3.out", delay: 0.3 }
    );

    // ─── Luxury hover interaction on the window scene itself ─────────────
    const windowScene = scopeRef.current?.querySelector('.window-scene');
    if (windowScene) {
      const handleEnter = () => gsap.to(windowScene, { scale: 1.015, duration: 1.2, ease: "power3.out" });
      const handleLeave = () => gsap.to(windowScene, { scale: 1, duration: 1.2, ease: "power3.out" });
      windowScene.addEventListener('mouseenter', handleEnter);
      windowScene.addEventListener('mouseleave', handleLeave);
      return () => {
        windowScene.removeEventListener('mouseenter', handleEnter);
        windowScene.removeEventListener('mouseleave', handleLeave);
      };
    }

  }, { scope: scopeRef });

  return (
    <div ref={scopeRef} className="relative">
      <Loader onComplete={() => setLoaderDone(true)} />
      <Navbar />

      {/* Fixed logo that animates up on scroll */}
      <div className="fixed inset-0 flex items-center justify-center z- pointer-events-none">
        <div ref={wordmarkRef}>
         <Image
  src="/pic/IMG_4817 copy (12) (1).png"
  alt="Company Logo"
  width={400}
  height={80}
  priority={true}
  className="w-auto object-contain"
  style={{ height: 'clamp(2.5rem, 5vw, 5rem)', maxWidth: '50vw' }}
/>
        </div>
      </div>

      {/* Reveal wrapper — hidden until fade-in */}
      <div ref={revealRef} style={{ opacity: 0 }}>

        {/* Sky background — fixed only behind the pinned hero, fades out as cream content rises */}
        <div ref={skyRef} className="fixed inset-0 -z-50" style={{ transform: 'translate3d(0,0,0)' }}>
          <Image src={skyImage} alt="sky" fill sizes="100vw" className="object-cover object-bottom" priority quality={100} />
        </div>

        {/* Cloud layer — multi-depth parallax */}
        <div ref={cloudLayerRef} className="fixed inset-0 -z-40 overflow-hidden pointer-events-none">
          {/* Far layer — slow, faint */}
         <div
            ref={cloudFarRef}
            className="absolute inset-0 h-full w-full" // Locked to viewport
            style={{
              backgroundImage: `url(${cloudsImage.src})`,
              // Convert relative size to viewport units to match original visual scale
              // Desktop: 1500vw * 40% = 600vw. Mobile: 500vw * 40% = 200vw.
              backgroundSize: 'clamp(200vw, 400vw, 600vw) 90%', 
              backgroundRepeat: 'repeat-x',
              opacity: 0.25,
              filter: 'blur(2px)',
              // will-change: transform is removed; we are no longer moving the node
            }}
          />
         
          {/* Mid layer — original speed/opacity */}
          <div
            ref={cloudMidRef}
            className="absolute inset-0 h-full w-[1500%] sm:w-[500%]"
            style={{
              backgroundImage: `url(${cloudsImage.src})`,
              backgroundSize: '50% 100%',
              backgroundRepeat: 'repeat-x',
              opacity: 0.55,
              willChange: 'transform',
              transform: 'translate3d(0,0,0)',
            }}
          />
          {/* Near layer — fast, larger, more present */}
          <div
            ref={cloudNearRef}
            className="absolute inset-0 h-full w-[1500%] sm:w-[500%]"
            style={{
              backgroundImage: `url(${cloudsImage.src})`,
              backgroundSize: '65% 110%',
              backgroundPosition: '0 60%',
              backgroundRepeat: 'repeat-x',
              opacity: 0.4,
              willChange: 'transform',
              transform: 'translate3d(0,0,0)',
            }}
          />
          {/* Legacy ref kept for cloud-loop compatibility */}
          <div ref={cloudsRef} className="absolute inset-0 pointer-events-none" />
        </div>

        {/* ─── PINNED HERO SECTION ─────────────────────────────────────── */}
        <div ref={mainContainer} className="relative w-full h-screen overflow-hidden">

          {/* Window frame (zooms to fill screen) */}
          <div
            ref={windowRef}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none will-change-transform"
            style={{ perspective: '1000px', backfaceVisibility: 'hidden' }}
          >
            <div className="window-scene relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
              {/* Scene visible through the window — looping cinematic video,
                  occupying the exact position, size, scale, transform, and
                  z-index the original destination image used. */}
              <video
                ref={innerVideoRef}
                className="absolute inset-0 w-full h-full object-cover scale-100 lg:scale-[1.3] z-10"
                style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                src="/video/hero.mp4"
                poster="/pic/hero-bg.webp"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
                tabIndex={-1}
              />
              {/* Atmospheric shadow / depth */}
              <Image src={shadowImage} priority alt="shadow" fill sizes="100vw" className="object-cover scale-100 lg:scale-[1.3] opacity-50 z-20" quality={100} style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }} />
              {/* Window frame outer */}
              <Image src={outerImage} priority alt="window frame" fill sizes="100vw" className="object-cover scale-100 lg:scale-[1.3] z-30" quality={100} style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }} />
              {/* Window top fixture */}
              <div className="absolute top-[22.5%] left-[50%] md:top-[10%] md:left-[50.3%] -translate-x-1/2 h-auto z-10" style={{ width: 'clamp(120px, 24vw, 50%)' }}>
                <Image src={aboveImage} priority alt="window top" width={400} height={200} className="object-contain" quality={100} />
              </div>
            </div>
          </div>

          {/* ─── HERO COPY ─────────────────────────────────────────────── */}
          <div
            ref={contentRef}
            className="absolute inset-0 z-20 flex items-center justify-between text-white pointer-events-none"
            style={{ paddingLeft: 'clamp(1.25rem, 5vw, 5rem)', paddingRight: 'clamp(1.25rem, 5vw, 5rem)' }}
          >
            {/* LEFT */}
            <div className="hidden md:block hero-text-left max-w-xs sm:max-w-sm md:max-w-md min-w-0">
              <h1 className="display-font leading-none tracking-tight font-light" style={{ fontSize: 'clamp(1.8rem, 6vw, 3.875rem)', marginTop: 'clamp(-6rem, -8vh, 0px)' }}>
                <span className="word-mask block"><span className="hero-word inline-block">The</span></span>
                <span className="word-mask block"><span className="hero-word inline-block">World</span></span>
                <span className="word-mask block"><span className="hero-word inline-block italic text-[var(--accent)]">Awaits</span></span>
              </h1>
              <div className="mt-16 space-y-4 hidden lg:block">
                <h2 className="text-sm font-light tracking-widest uppercase text-white/70">Your window<br />to wonder</h2>
                <div className="accent-line" />
                <p className="text-[10px] font-light leading-5 max-w-[260px] text-white/60">
                  Every destination tells a story. Every journey transforms you. Let the world change the way you see.
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="hidden md:flex hero-text-right max-w-xs sm:max-w-sm md:max-w-md flex-col items-end min-w-0">
              <h1 className="display-font font-light leading-none tracking-tight text-right" style={{ fontSize: 'clamp(1.6rem, 5.5vw, 3.5rem)', paddingTop: 'clamp(4rem, 15vh, 14rem)' }}>
                <span className="word-mask block"><span className="hero-word inline-block">Beyond</span></span>
                <span className="word-mask block"><span className="hero-word inline-block italic text-[var(--accent)]">Navigator</span></span>
              </h1>
            </div>
          </div>

          {/* Scroll indicator */}
          <div 
            className="scroll-indicator absolute z-20 text-white cursor-pointer hover:opacity-80 transition-opacity" 
            style={{ bottom: 'clamp(1.5rem, 4vh, 4rem)', right: 'clamp(1rem, 4vw, 4rem)', width: 'clamp(130px, 28vw, 240px)' }}
            onClick={() => {
              const candidates = Array.from(document.querySelectorAll('section, [id]'));
              let targetElement = null;
              for (const el of candidates) {
                if (el.getBoundingClientRect().top > window.innerHeight * 0.5) {
                  targetElement = el;
                  break;
                }
              }
              const navbarHeight = 64;
              if (targetElement) {
                const targetPosition = window.scrollY + targetElement.getBoundingClientRect().top - navbarHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
              } else {
                window.scrollTo({ top: window.innerHeight * 2.8, behavior: 'smooth' });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Scroll to next section"
          >
            <div className="mb-4 h-[1px] w-full bg-white/30" />
            <div className="hidden sm:flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 text-[8px] lg:text-[9px] font-medium tracking-widest text-white/60">
                <div className="flex flex-col -space-y-2">
                  <ChevronDown size={14} />
                  <ChevronDown size={14} className="-mt-[10px]" />
                  <ChevronDown size={14} className="-mt-[10px]" />
                </div>
                <span>SCROLL DOWN</span>
              </div>
              <p className="text-[8px] lg:text-[9px] tracking-widest text-white/40">EXPLORE THE WORLD</p>
            </div>
          </div>

          {/* ─── SECOND SECTION (rises from below after zoom) ──────────── */}
          <div
            ref={secondSectionRef}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-left text-white pointer-events-none opacity-0"
            style={{ paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)' }}
          >
            <h2 className="display-font w-full font-light leading-tight sm:leading-snug" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.75rem)', maxWidth: 'min(100%, 64rem)' }}>
              <span className="font-normal">Navigator</span>  
              <span ref={paragraphRef}>  curates transformative travel to over 180 countries — from hidden villages to skyline suites, from rain forest trails to turquoise coastlines. Your next story begins here.</span>
            </h2>
          </div>

        </div>

        {/* Remaining page sections */}
        <About />

      </div>
    </div>
  );
};

export default SmoothScrollHero;