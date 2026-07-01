"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [navTheme, setNavTheme] = useState("dark");
  const pathname = usePathname();

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-40px 0px -80% 0px",
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const theme = entry.target.getAttribute("data-nav-theme");
          if (theme) {
            setNavTheme(theme);
          }
        }
      });
    }, observerOptions);

    const observeSections = () => {
      const sections = document.querySelectorAll("[data-nav-theme]");
      sections.forEach(sec => observer.observe(sec));
    };

    observeSections();

    const mutationObserver = new MutationObserver(() => {
      observeSections();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const isDestinations = pathname && pathname.startsWith("/destinations");

  const navLinks = [
    isDestinations 
      ? { text: "HOME", href: "/" }
      : { text: "DESTINATIONS", href: "/destinations" },
    { text: "ABOUT",        href: "#about" },
    { text: "CONTACT",      href: "#contact" },
  ];

  return (
    <>
      <style>{`
        .nav--dark {
          --nav-bg: rgba(18, 18, 18, 0.22);
          --nav-border: rgba(255, 255, 255, 0.22);
          --nav-text: rgba(255, 255, 255, 0.92);
          --nav-hover-bg: rgba(255, 255, 255, 0.1);
          --nav-active-bg: rgba(255, 255, 255, 0.15);
        }

        .nav--light {
          --nav-bg: rgba(255, 255, 255, 0.70);
          --nav-border: rgba(0, 0, 0, 0.12);
          --nav-text: #1d1d1d;
          --nav-hover-bg: rgba(0, 0, 0, 0.05);
          --nav-active-bg: rgba(0, 0, 0, 0.08);
        }

        .glass-capsule {
          background-color: var(--nav-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--nav-border);
          border-radius: 999px;
          display: flex;
          align-items: center;
          padding: 6px;
          transition: background-color 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease;
        }

        .glass-nav-item {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--nav-text);
          padding: 10px 24px;
          border-radius: 999px;
          transition: color 0.35s ease, background-color 0.35s ease;
          cursor: pointer;
        }

        @media (hover: hover) {
          .glass-nav-item:hover {
            background-color: var(--nav-hover-bg);
          }
        }

        .glass-nav-item.is-active {
          background-color: var(--nav-active-bg);
        }
      `}</style>

      <nav className={`fixed top-[28px] left-[40px] z-[100] nav--${navTheme}`}>
        <div className="flex glass-capsule">
          {navLinks.map((l) => {
            const isActive = pathname === l.href;
            return (
              <a
                key={l.text}
                href={l.href}
                className={`glass-nav-item ${isActive ? "is-active" : ""}`}
              >
                {l.text}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;