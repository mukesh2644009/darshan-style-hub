'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getMetaCookies } from '@/lib/utm';

export default function MetaPageView() {
  const pathname = usePathname();
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const eventId = `PageView_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = window.location.href;

    // Fire pixel PageView with eventId for deduplication
    const fire = () => {
      if (window.fbq) {
        window.fbq('track', 'PageView', {}, { eventID: eventId });
        sendCapiPageView(eventId, url);
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          if (window.fbq) {
            window.fbq('track', 'PageView', {}, { eventID: eventId });
            sendCapiPageView(eventId, url);
            clearInterval(interval);
          } else if (++attempts > 20) {
            clearInterval(interval);
          }
        }, 100);
      }
    };

    fire();
  }, [pathname]);

  return null;
}

// Wait for _fbp cookie before sending — pixel sets _fbp async,
// so reading immediately after fbq init gives empty string.
function sendCapiPageView(eventId: string, url: string, maxWaitMs = 2000) {
  const start = Date.now();
  const attempt = () => {
    const { fbc, fbp } = getMetaCookies();
    if (fbp || Date.now() - start > maxWaitMs) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'PageView',
          eventSourceUrl: url,
          eventId,
          ...(fbc && { fbc }),
          ...(fbp && { fbp }),
        }),
      }).catch(() => {});
    } else {
      setTimeout(attempt, 100);
    }
  };
  attempt();
}
