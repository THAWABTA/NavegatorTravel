"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";


// ---------------------------------------------------------------------------
// Focus-window reading animation
//
// Three word states:
//   NOT YET TRIGGERED → opacity 0 (invisible, scroll hasn't reached element)
//   AHEAD of cursor   → opacity 0.18, blur 3px  (dim, waiting)
//   ACTIVE (in window)→ opacity 1,    blur 0     (fully alive)
//   BEHIND cursor     → opacity 0.55, blur 0     (settled, read)
//
// A cursor band of fixed width CURSOR_WIDTH slides across [0,1] scroll space.
// Only the 1-2 words whose position falls inside that band are mid-transition.
// ---------------------------------------------------------------------------

const CURSOR_WIDTH   = 0.13;
const AHEAD_OPACITY  = 0.18;
const AHEAD_BLUR     = 3;
const BEHIND_OPACITY = 0.55;

const smoothstep = (t) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// Local t ∈ [0,1] for word i at global scroll progress gp.
// t=0: ahead of cursor. t=1: behind cursor. 0<t<1: inside window.
const wordT = (gp, i, N) => {
  if (N <= 1) return smoothstep(Math.min(1, Math.max(0, gp / (1 - CURSOR_WIDTH))));
  const cursor     = Math.min(1, Math.max(0, gp / (1 - CURSOR_WIDTH)));
  const wordCenter = i / (N - 1);
  const raw        = (cursor - wordCenter + CURSOR_WIDTH / 2) / CURSOR_WIDTH;
  return smoothstep(raw);
};

const buildFocusReveal = (nodes, trigger, start, end) => {
  if (!nodes || nodes.length === 0) return null;
  const N = nodes.length;

  // Initialize fully hidden — AHEAD dim state only kicks in once scrolled into range
  nodes.forEach((n) => {
    n.style.opacity    = "0";
    n.style.transform  = "translateY(0px)";
    n.style.filter     = "none";
    n.style.willChange = "transform, opacity, filter";
  });

  return ScrollTrigger.create({
    trigger,
    start,
    end,
    scrub: true,
    onUpdate(self) {
      const gp = self.progress;

      nodes.forEach((node, i) => {
        const t = wordT(gp, i, N);

        let opacity, blur, y;

        if (t <= 0) {
          // AHEAD — dim once trigger has started, invisible before
          opacity = gp > 0 ? AHEAD_OPACITY : 0;
          blur    = gp > 0 ? AHEAD_BLUR    : 0;
          y       = 0;
        } else if (t < 0.5) {
          // ENTERING focus window
          const enter = t / 0.5;
          opacity = AHEAD_OPACITY + (1 - AHEAD_OPACITY) * enter;
          blur    = AHEAD_BLUR * (1 - enter);
          y       = (1 - enter) * 7;
        } else if (t < 1) {
          // LEAVING focus window
          const leave = (t - 0.5) / 0.5;
          opacity = 1 - (1 - BEHIND_OPACITY) * leave;
          blur    = 0;
          y       = 0;
        } else {
          // BEHIND — permanently settled
          opacity = BEHIND_OPACITY;
          blur    = 0;
          y       = 0;
        }

        node.style.opacity   = String(opacity);
        node.style.transform = y > 0.01 ? `translateY(${y}px)` : "translateY(0px)";
        node.style.filter    = blur > 0.05 ? `blur(${blur}px)` : "none";
      });
    },
  });
};

export const useSplitReveal = (scopeRef) => {
  const splitInstancesRef = useRef([]);

  useGSAP(
    () => {
      if (!scopeRef?.current) return;

      const splitInstances = [];
      const scrollTriggers = [];
      const elements = scopeRef.current.querySelectorAll("[data-split]");

      elements.forEach((el) => {
        const mode = el.dataset.split;

        if (mode === "chars") {
          const split = new SplitType(el, { types: "chars" });
          splitInstances.push(split);
          const st = buildFocusReveal(split.chars, el, "top 92%", "top 20%");
          if (st) scrollTriggers.push(st);
        }

        else if (mode === "heading") {
          const split = new SplitType(el, { types: "lines, words" });
          splitInstances.push(split);
          const st = buildFocusReveal(split.words, el, "top 88%", "top 5%");
          if (st) scrollTriggers.push(st);
        }

        else if (mode === "fade") {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24, filter: "blur(8px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%" },
            }
          );
        }
      });

      splitInstancesRef.current = splitInstances;

      return () => {
        scrollTriggers.forEach((st) => st.kill());
        splitInstancesRef.current.forEach((s) => s.revert());
        splitInstancesRef.current = [];
      };
    },
    { scope: scopeRef }
  );
};