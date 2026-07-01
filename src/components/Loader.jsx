"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const Loader = ({ onComplete }) => {
  const rootRef = useRef(null);
  const logoRef = useRef(null);
  const lineRef = useRef(null);
  const taglineRef = useRef(null);
  const completedRef = useRef(false);

  useGSAP(
    (_context, contextSafe) => {
      // Anything created inside async callbacks (onComplete, events, rAF)
      // must be wrapped in contextSafe() or it escapes automatic cleanup.
      const finish = contextSafe(() => {
        if (completedRef.current) return;
        completedRef.current = true;

        if (rootRef.current) {
          rootRef.current.style.display = "none";
        }
        onComplete?.();
      });

      const fadeOutAndFinish = contextSafe(() => {
        if (!rootRef.current) {
          finish();
          return;
        }
        gsap.to(rootRef.current, {
          opacity: 0,
          duration: 0.9,
          ease: "power2.inOut",
          onComplete: finish,
        });
      });

      const tl = gsap.timeline({ onComplete: fadeOutAndFinish });

      tl.set(logoRef.current, {
        opacity: 0,
        filter: "blur(12px)",
        letterSpacing: "0.6em",
      });

      tl.set(taglineRef.current, {
        opacity: 0,
        y: 10,
      });

      tl.set(lineRef.current, {
        scaleX: 0,
      });

      tl.to(logoRef.current, {
        opacity: 1,
        filter: "blur(0px)",
        letterSpacing: "0.3em",
        duration: 1.4,
        ease: "power3.out",
      });

      tl.to(
        lineRef.current,
        {
          scaleX: 1,
          duration: 1.6,
          ease: "power2.inOut",
        },
        "-=0.6"
      );

      tl.to(
        taglineRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.4"
      );

      tl.to({}, { duration: 0.5 });

      // Runs on unmount/HMR/dependency change. If the component goes away
      // before the fade-out tween fires, this guarantees we never touch
      // rootRef.current again and never double-fire onComplete.
      return () => {
        completedRef.current = true;
      };
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
      style={{ background: "#2A1E16" }}
    >
      <span
        ref={logoRef}
        className="display-font text-white text-2xl sm:text-3xl lg:text-4xl tracking-[0.3em] font-light italic"
      >
        
      </span>

      <div className="mt-8 w-40 sm:w-56 h-[1px] bg-white/15 overflow-hidden">
        <div
          ref={lineRef}
          className="h-full w-full bg-[var(--accent)] origin-left"
        />
      </div>

      <p
        ref={taglineRef}
        className="mt-6 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-white/50 font-light"
      >
        Preparing your departure
      </p>
    </div>
  );
};

export default Loader;
