'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconPhone,
  IconMail,
  IconLock,
} from '@tabler/icons-react';
import './ConciergeSection.css';
import { DESTINATIONS as RAW_DESTINATIONS } from '../data/destinations';

gsap.registerPlugin(ScrollTrigger);

/* ── SVG Icons (inline — no external dep) ───────────────────── */
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const TRUST_ITEMS = [
  {
    icon: <IconPhone size={22} stroke={1.4} />,
    label: 'Travel Consultants',
    sub: 'World-class travel experts\ndedicated to you.',
  },
  {
    icon: <IconMail size={22} stroke={1.4} />,
    label: 'Response Within 30 Min',
    sub: 'We value your time as\nmuch as you do.',
  },
  {
    icon: <IconBrandWhatsapp size={22} stroke={1.4} />,
    label: '24/7 Support',
    sub: 'Whenever you need us,\nwherever you are.',
  },
  {
    icon: <IconLock size={22} stroke={1.4} />,
    label: 'Completely Confidential',
    sub: 'Your privacy is our\nhighest priority.',
  },
];



const DESTINATIONS = [
  '',
  ...RAW_DESTINATIONS.map(d => `${d.name}, ${d.region}`),
  'Somewhere new — surprise me',
];

const CONTACTS = [
  {
    id: 'instagram',
    Icon: IconBrandInstagram,
    label: 'Instagram',
    value: '@navigator.travel',
    desc: 'Follow our latest journeys',
    href: 'https://www.instagram.com/nttjordan',
  },
  {
    id: 'facebook',
    Icon: IconBrandFacebook,
    label: 'Facebook',
    value: 'Navigator Travel',
    desc: "Stories from the world's edges",
    href: 'https://www.facebook.com/navigator.jordan/',
  },
  {
    id: 'phone',
    Icon: IconPhone,
    label: 'Phone',
    value: '+962 792227711',
    desc: 'Private Concierge',
    href: 'tel:+962792227711',
  },
  {
    id: 'email',
    Icon: IconMail,
    label: 'Email',
    value: 'info@navigatortravel-jo.com',
    desc: 'Replies within 30 minutes',
    href: 'mailto:info@navigatortravel-jo.com',
  },
  {
    id: 'whatsapp',
    Icon: IconBrandWhatsapp,
    label: 'WhatsApp',
    value: 'Direct Luxury Concierge',
    desc: 'Instant Assistance',
    href: 'https://wa.me/962792227711',
  },
  {
    id: 'phone2',
    Icon: IconPhone,
    label: 'Phone',
    value: '+962 7 9222 7712',
    desc: 'Private Concierge',
    href: 'tel:+962792227712',
  },
];

export default function ConciergeSection() {
  const rootRef      = useRef(null);
  const videoRef     = useRef(null);
  const heroRef      = useRef(null);
  const drawerRef    = useRef(null);
  const overlayRef   = useRef(null);

  const btn2Ref      = useRef(null);
  const contactsRef  = useRef(null);
  const [open, setOpen]   = useState(false);
  const [sent, setSent]   = useState(false);

  /* ── Open / close drawer ───────────────────────────────────── */

  const closeDrawer = () => {
    const drawer  = drawerRef.current;
    const overlay = overlayRef.current;
    if (!drawer || !overlay) return;
    gsap.to(drawer,  { y: '100%', duration: 0.75, ease: 'power3.inOut' });
    gsap.to(overlay, { opacity: 0, duration: 0.5, ease: 'power2.out',
      onComplete: () => {
        setOpen(false);
        document.body.style.overflow = '';
      }
    });
  };

  /* ── Animate drawer open ───────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const drawer  = drawerRef.current;
    const overlay = overlayRef.current;
    if (!drawer || !overlay) return;
    gsap.set(drawer, { y: '100%' });
    gsap.to(overlay, { opacity: 1, duration: 0.55, ease: 'power2.out' });
    gsap.to(drawer,  { y: '0%',  duration: 1.0,  ease: 'power4.out', delay: 0.05 });
    // Stagger fields in
    const fields = drawer.querySelectorAll('.cc-form-field');
    gsap.fromTo(fields,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out',
        stagger: 0.07, delay: 0.45 }
    );
  }, [open]);

  /* ── Main GSAP ─────────────────────────────────────────────── */
  useGSAP(() => {
    const root     = rootRef.current;
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [];

    /* Slow video parallax */
    if (!noMotion && videoRef.current) {
      gsap.fromTo(videoRef.current,
        { scale: 1.12 },
        { scale: 1, ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true }
        }
      );
    }

    /* Hero lines — stagger reveal */
    const lines = root.querySelectorAll('.cc-line-inner');
    if (lines.length && !noMotion) {
      gsap.fromTo(lines,
        { y: '106%' },
        { y: '0%', duration: 1.2, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: heroRef.current, start: 'top 82%' }
        }
      );
    } else {
      gsap.set(lines, { y: '0%' });
    }

    /* Eyebrow + desc + buttons fade */
    const fadeEls = root.querySelectorAll('.cc-hero-eyebrow, .cc-hero-desc, .cc-hero-btns, .cc-hero-note');
    if (!noMotion) {
      gsap.fromTo(fadeEls,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: heroRef.current, start: 'top 78%' }
        }
      );
    } else {
      gsap.set(fadeEls, { opacity: 1 });
    }

    /* Trust items */
    const trustItems = root.querySelectorAll('.cc-trust-item');
    if (trustItems.length) {
      gsap.fromTo(trustItems,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: trustItems[0].closest('.cc-trust-bar'), start: 'top 90%' }
        }
      );
    }


    /* Button 1 — magnetic */
    [btn2Ref].forEach(bRef => {
      const btn = bRef.current;
      if (!btn) return;
      const onMove = (e) => {
        const r  = btn.getBoundingClientRect();
        const cx = (e.clientX - r.left - r.width  * 0.5) * 0.2;
        const cy = (e.clientY - r.top  - r.height * 0.5) * 0.2;
        gsap.to(btn, { x: cx, y: cy, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      };
      const onLeave = () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' });
      };
      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        btn.removeEventListener('mousemove', onMove);
        btn.removeEventListener('mouseleave', onLeave);
      });
    });

    /* Scroll indicator bounce */
    const scrollInd = root.querySelector('.cc-scroll-orb');
    if (scrollInd && !noMotion) {
      gsap.to(scrollInd, {
        y: 10, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
    }

    /* Contact cards stagger */
    const contactCards = root.querySelectorAll('.cc-contact-card');
    if (contactCards.length) {
      gsap.fromTo(contactCards,
        { opacity: 0, x: -18 },
        {
          opacity: 1, x: 0, duration: 0.75, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: contactsRef.current, start: 'top 88%' },
        }
      );
    }

    return () => cleanups.forEach(fn => fn());
  }, { scope: rootRef });

  /* ── Drawer input underline ────────────────────────────────── */
  const handleFocus = (e) => {
    const fill = e.target.closest('.cc-form-field')?.querySelector('.cc-ul-fill');
    if (fill) gsap.to(fill, { scaleX: 1, duration: 0.45, ease: 'power3.out' });
  };
  const handleBlur = (e) => {
    const fill = e.target.closest('.cc-form-field')?.querySelector('.cc-ul-fill');
    if (fill) gsap.to(fill, { scaleX: 0, duration: 0.35, ease: 'power3.in' });
  };

  return (
    <section ref={rootRef} className="cc-root" id="contact">

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <div ref={heroRef} className="cc-hero">

        {/* Video */}
        <div className="cc-video-wrap" aria-hidden="true">
          <video
            ref={videoRef}
            className="cc-video"
            src="/video/vid3.mp4"
            autoPlay muted loop playsInline preload="none"
          />
          <div className="cc-video-overlay" />
        </div>

        {/* Content */}
        <div className="cc-hero-content">
          <div className="cc-hero-eyebrow">
            <span className="cc-eyebrow-line" aria-hidden="true" />
            <span>Private Travel Concierge</span>
          </div>

          <h2 className="cc-hero-heading" aria-label="Your journey begins with a conversation.">
            <span className="cc-line"><span className="cc-line-inner">Your journey</span></span>
            <span className="cc-line"><span className="cc-line-inner">begins with a</span></span>
            <span className="cc-line cc-line--italic"><span className="cc-line-inner">conversation.</span></span>
          </h2>

          <p className="cc-hero-desc">
            Extraordinary experiences are never planned.<br />
            They are crafted — exclusively for you.
          </p>

          <div className="cc-hero-btns">


            <a
              ref={btn2Ref}
              href="https://wa.me/96279123456"
              target="_blank"
              rel="noopener noreferrer"
              className="cc-btn cc-btn--ghost w-full sm:w-auto justify-center"
            >
              <span className="cc-btn-icon-left"><IconWhatsApp /></span>
              <span className="cc-btn-text">Talk to Concierge</span>
            </a>
          </div>

          <p className="cc-hero-note">Usually replies within 30 minutes during working hours</p>
        </div>

        {/* Scroll indicator */}
        <div className="cc-scroll-indicator" aria-hidden="true">
          <span className="cc-scroll-label">Discover</span>
          <span className="cc-scroll-track">
            <span className="cc-scroll-orb" />
          </span>
        </div>
      </div>

      {/* ═══ TRUST BAR ══════════════════════════════════════════ */}
      <div className="cc-trust-bar">
        {TRUST_ITEMS.map((item, i) => (
          <React.Fragment key={item.label}>
            <div className="cc-trust-item">
              <span className="cc-trust-icon">{item.icon}</span>
              <div className="cc-trust-text">
                <span className="cc-trust-label">{item.label}</span>
                <span className="cc-trust-sub">{item.sub}</span>
              </div>
            </div>
            {i < TRUST_ITEMS.length - 1 && (
              <span className="cc-trust-divider" aria-hidden="true" />
            )}
          </React.Fragment>
        ))}
      </div>


      {/* ═══ CONTACT SECTION ════════════════════════════════════ */}
      <div ref={contactsRef} className="cc-contacts-root">

        {/* Header */}
        <div className="cc-contacts-header">
          <span className="cc-contacts-eyebrow">
            <span className="cc-eyebrow-line" aria-hidden="true" />
            Get in Touch
          </span>
          <h2 className="cc-contacts-heading">
            <span className="cc-contacts-line">Luxury</span>
            <span className="cc-contacts-line cc-contacts-line--italic">Contact</span>
          </h2>
          <p className="cc-contacts-sub">
            Every great journey begins with a single word.<br />
            Reach us through the channel that suits you best.
          </p>
          <span className="cc-contacts-gold-rule" aria-hidden="true" />
        </div>

        {/* Cards */}
        <div className="cc-contacts-grid">
          {CONTACTS.map(({ id, Icon, label, value, desc, href }) => (
            <a
              key={id}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="cc-contact-card"
              aria-label={`${label}: ${value}`}
            >
              <span className="cc-contact-vessel" aria-hidden="true">
                <Icon size={22} stroke={1.4} />
              </span>
              <span className="cc-contact-body">
                <span className="cc-contact-label">{label}</span>
                <span className="cc-contact-value">{value}</span>
                <span className="cc-contact-desc">{desc}</span>
              </span>
              <span className="cc-contact-arrow" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            </a>
          ))}
        </div>

      </div>

      {/* ═══ FORM DRAWER ════════════════════════════════════════ */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            ref={overlayRef}
            className="cc-overlay"
            style={{ opacity: 0 }}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div ref={drawerRef} className="cc-drawer" role="dialog" aria-modal="true" aria-label="Journey request form">
            <div className="cc-drawer-inner">

              {/* Drawer header */}
              <div className="cc-drawer-head">
                <div>
                  <p className="cc-drawer-eyebrow">Start Planning</p>
                  <h3 className="cc-drawer-title">
                    {sent ? 'Your journey has been received.' : 'Tell us about your journey'}
                  </h3>
                </div>
                <button
                  type="button"
                  className="cc-drawer-close"
                  onClick={closeDrawer}
                  aria-label="Close"
                >
                  <IconClose />
                </button>
              </div>

              {!sent ? (
                <>
                  <div className="cc-form-grid">

                    {/* Destination */}
                    <div className="cc-form-field cc-field-full">
                      <select
                        className="cc-fi cc-fi-select"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        defaultValue=""
                      >
                        <option value="" disabled>Where would you like to go?</option>
                        {DESTINATIONS.filter(Boolean).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <span className="cc-ul-base" aria-hidden="true" />
                      <span className="cc-ul-fill" aria-hidden="true" />
                      <span className="cc-fi-caret" aria-hidden="true">↓</span>
                    </div>

                    {/* Experience */}
                    <div className="cc-form-field cc-field-full">
                      <input
                        type="text"
                        className="cc-fi"
                        placeholder="What experience are you looking for?"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                      <span className="cc-ul-base" aria-hidden="true" />
                      <span className="cc-ul-fill" aria-hidden="true" />
                    </div>

                    {/* Dates */}
                    <div className="cc-form-field">
                      <input
                        type="date"
                        className="cc-fi"
                        placeholder="Departure"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                      <span className="cc-ul-base" aria-hidden="true" />
                      <span className="cc-ul-fill" aria-hidden="true" />
                    </div>

                    {/* Guests */}
                    <div className="cc-form-field">
                      <select
                        className="cc-fi cc-fi-select"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        defaultValue=""
                      >
                        <option value="" disabled>How many guests?</option>
                        {['Just me', '2 guests', '3–4 guests', '5–8 guests', 'Private group (9+)'].map(g => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                      <span className="cc-ul-base" aria-hidden="true" />
                      <span className="cc-ul-fill" aria-hidden="true" />
                      <span className="cc-fi-caret" aria-hidden="true">↓</span>
                    </div>

                    {/* Phone */}
                    <div className="cc-form-field">
                      <input
                        type="tel"
                        className="cc-fi"
                        placeholder="Your phone number"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                      <span className="cc-ul-base" aria-hidden="true" />
                      <span className="cc-ul-fill" aria-hidden="true" />
                    </div>

                    {/* Email */}
                    <div className="cc-form-field">
                      <input
                        type="email"
                        className="cc-fi"
                        placeholder="Your email address"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                      <span className="cc-ul-base" aria-hidden="true" />
                      <span className="cc-ul-fill" aria-hidden="true" />
                    </div>

                    {/* Vision */}
                    <div className="cc-form-field cc-field-full">
                      <textarea
                        className="cc-fi cc-fi-ta"
                        rows={3}
                        placeholder="Anything you'd love us to know? A celebration, an escape, a dream long held…"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                      <span className="cc-ul-base" aria-hidden="true" />
                      <span className="cc-ul-fill" aria-hidden="true" />
                    </div>

                  </div>

                  {/* Submit */}
                  <div className="cc-form-footer">
                    <button
                      type="button"
                      className="cc-submit"
                      onClick={() => setSent(true)}
                    >
                      <span className="cc-submit-text">Request a Private Journey</span>
                      <span className="cc-submit-arrow"><IconArrow /></span>
                      <span className="cc-submit-fill" aria-hidden="true" />
                    </button>
                    <p className="cc-form-privacy">
                      <IconMail size={14} stroke={1.4} />
                      Private &amp; Confidential · We never share your details
                    </p>
                  </div>
                </>
              ) : (
                <div className="cc-sent">
                  <span className="cc-sent-mark">✦</span>
                  <p className="cc-sent-body">
                    A dedicated member of our concierge team will reach out within 30 minutes.
                    Thank you for trusting Navigator with your next extraordinary chapter.
                  </p>
                  <button type="button" className="cc-sent-close" onClick={closeDrawer}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </section>
  );
}