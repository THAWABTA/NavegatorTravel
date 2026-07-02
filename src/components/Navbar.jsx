"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Navbar = () => {
  const [navTheme, setNavTheme] = useState("dark");
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const toggleBtnRef = useRef(null);
  const menuOverlayRef = useRef(null);
  const menuItemsContainerRef = useRef(null);
  const isInitialRender = useRef(true);

  useGSAP(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      gsap.set(menuOverlayRef.current, { display: "none", opacity: 0 });
      return;
    }

    if (isOpen) {
      gsap.set(menuOverlayRef.current, { display: "flex" });
      gsap.fromTo(
        menuOverlayRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
      
      if (menuItemsContainerRef.current) {
        gsap.fromTo(
          menuItemsContainerRef.current.children,
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
        );
      }

      const focusableNodes = menuOverlayRef.current.querySelectorAll('a[href], button');
      const focusableArray = [toggleBtnRef.current, ...Array.from(focusableNodes)];
      const firstElement = focusableArray[0];
      const lastElement = focusableArray[focusableArray.length - 1];

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          return;
        }
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      if (menuOverlayRef.current) {
        gsap.to(menuOverlayRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(menuOverlayRef.current, { display: "none" });
            toggleBtnRef.current?.focus();
          }
        });
      }
    }
  }, [isOpen]);

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
    { text: "ABOUT",        href: "/#about" },
    { text: "CONTACT",      href: "/#contact" },
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
          padding: 12px 24px;
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

      <nav className={`fixed top-[20px] left-[20px] md:top-[28px] md:left-[40px] z-[100] nav--${navTheme}`}>
        {/* Desktop Navbar */}
        <div className="hidden md:flex">
          <div className="glass-capsule">
            {navLinks.map((l) => {
              const isActive = pathname === l.href;
              return (
                <Link
                  key={l.text}
                  href={l.href}
                  className={`glass-nav-item ${isActive ? "is-active" : ""}`}
                >
                  {l.text}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="flex md:hidden relative">
          <button 
            ref={toggleBtnRef}
            onClick={() => setIsOpen(!isOpen)}
            className="relative z-[210] glass-capsule btn-ui-icon !p-0 hover:bg-[var(--nav-hover-bg)]"
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={18} color="var(--nav-text)" /> : <Menu size={18} color="var(--nav-text)" />}
          </button>

          {/* Mobile Menu Dropdown */}
          <div 
            id="mobile-menu"
            ref={menuOverlayRef}
            className="absolute top-full left-0 mt-2 w-[200px] z-[200] bg-[var(--bg)] border border-[var(--line)] shadow-lg rounded-md overflow-hidden flex-col"
            style={{ display: 'none', opacity: 0 }}
            role="menu"
            aria-orientation="vertical"
            aria-hidden={!isOpen}
          >
            <div className="flex flex-col w-full py-2" ref={menuItemsContainerRef}>
              {navLinks.map((l) => {
                const isActive = pathname === l.href;
                return (
                  <Link
                    key={l.text}
                    href={l.href}
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                    className={`w-full text-left px-6 py-3 text-[11px] font-medium tracking-[0.18em] uppercase transition-colors focus:outline-none focus:bg-black/5 hover:bg-black/5 ${isActive ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}
                  >
                    {l.text}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;