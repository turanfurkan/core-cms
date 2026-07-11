'use client';

import { useEffect, useRef } from 'react';

export default function StravaEmbed({ html }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!html) return;

    // Check if the Strava embeds script is already added to the document
    const scriptSrc = 'https://strava-embeds.com/embed.js';
    let existingScript = document.querySelector(`script[src="${scriptSrc}"]`);

    const triggerBootstrap = () => {
      if (typeof window !== 'undefined' && window.__STRAVA_EMBED_BOOTSTRAP__) {
        window.__STRAVA_EMBED_BOOTSTRAP__();
      }
    };

    if (!existingScript) {
      const newScript = document.createElement('script');
      newScript.src = scriptSrc;
      newScript.async = true;
      newScript.onload = triggerBootstrap;
      document.body.appendChild(newScript);
    } else {
      // If the script already exists, manually trigger the bootstrap function
      // to resolve any newly rendered placeholders on client navigation
      triggerBootstrap();
      const timer1 = setTimeout(triggerBootstrap, 50);
      const timer2 = setTimeout(triggerBootstrap, 200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [html]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
