"use client";
import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const FloatingButton = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return visible ? (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed z-[500] btn-ui-icon bg-[var(--accent)] text-white hover:bg-[var(--accent-soft)] shadow-lg"
      style={{ bottom: 'clamp(1rem, 3vw, 2rem)', right: 'clamp(1rem, 3vw, 2rem)' }}
    >
      <ArrowUp size={18} />
    </button>
  ) : null;
};

export default FloatingButton;