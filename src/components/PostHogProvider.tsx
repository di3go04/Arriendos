'use client';

import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

let _globalInitialized = false;

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || _globalInitialized) return;
    if (typeof window === 'undefined') return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      persistence: 'localStorage',
      capture_pageview: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      opt_in_site_apps: false,
      advanced_disable_toolbar_metrics: true,
    });

    initialized.current = true;
    _globalInitialized = true;
  }, []);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !_globalInitialized) return;
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
