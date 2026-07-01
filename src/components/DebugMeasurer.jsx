"use client";
import { useEffect } from 'react';

export default function DebugMeasurer() {
  useEffect(() => {
    setTimeout(() => {
      const getStyles = (btn) => {
        if (!btn) return 'Not found';
        const s = window.getComputedStyle(btn);
        return {
          height: s.height,
          paddingTop: s.paddingTop,
          paddingBottom: s.paddingBottom,
          paddingLeft: s.paddingLeft,
          paddingRight: s.paddingRight,
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          borderTopWidth: s.borderTopWidth,
          borderBottomWidth: s.borderBottomWidth,
          display: s.display,
          boxSizing: s.boxSizing,
          fontFamily: s.fontFamily,
          alignItems: s.alignItems,
        };
      };

      const exploreBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Explore Destination'));
      const conciergeBtns = Array.from(document.querySelectorAll('.cc-btn'));
      const beginJourney = conciergeBtns.find(b => b.textContent.includes('Begin Your Journey'));
      const talkConcierge = conciergeBtns.find(b => b.textContent.includes('Talk to Concierge'));
      const conciergeSubmit = document.querySelector('.cc-submit');

      const data = {
        exploreDestination: getStyles(exploreBtn),
        beginJourney: getStyles(beginJourney),
        talkConcierge: getStyles(talkConcierge),
        requestJourney: getStyles(conciergeSubmit)
      };

      fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(e => console.error(e));
    }, 3000); // Wait for animations and mount
  }, []);

  return null;
}
