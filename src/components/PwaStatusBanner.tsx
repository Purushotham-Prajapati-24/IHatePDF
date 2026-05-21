import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const RECHECK_INTERVAL_MS = 60 * 60 * 1000;

type BannerState = 'hidden' | 'ready' | 'refresh' | 'offline' | 'error';

export function PwaStatusBanner() {
  const [serviceWorkerError, setServiceWorkerError] = useState<string | null>(null);
  const {
    offlineReady: [isOfflineReady, setOfflineReady],
    needRefresh: [needsRefresh, setNeedsRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) {
        return;
      }

      window.setInterval(() => {
        void registration.update().catch(() => {
          setServiceWorkerError(`Could not check ${swUrl} for an offline update.`);
        });
      }, RECHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      setServiceWorkerError(error instanceof Error ? error.message : 'Offline mode could not start.');
    },
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const syncNetworkState = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', syncNetworkState);
    window.addEventListener('offline', syncNetworkState);

    return () => {
      window.removeEventListener('online', syncNetworkState);
      window.removeEventListener('offline', syncNetworkState);
    };
  }, []);

  const bannerState = useMemo<BannerState>(() => {
    if (isDismissed) {
      return 'hidden';
    }

    if (serviceWorkerError) {
      return 'error';
    }

    if (needsRefresh) {
      return 'refresh';
    }

    if (!isOnline) {
      return 'offline';
    }

    return isOfflineReady ? 'ready' : 'hidden';
  }, [isDismissed, isOfflineReady, isOnline, needsRefresh, serviceWorkerError]);

  if (bannerState === 'hidden') {
    return null;
  }

  const content = getBannerContent(bannerState, serviceWorkerError);

  return (
    <aside className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-border-glass bg-bg-card/90 p-4 text-text-primary shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <content.Icon className="mt-1 shrink-0 text-brand-primary" size={22} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-outfit text-base font-bold">{content.title}</p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{content.message}</p>
          {bannerState === 'refresh' ? (
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="mt-3 rounded-lg border border-brand-primary/40 bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90"
            >
              Apply update
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss PWA status"
          onClick={() => {
            setIsDismissed(true);
            setOfflineReady(false);
            setNeedsRefresh(false);
          }}
          className="rounded-lg border border-border-glass p-2 text-text-secondary transition hover:text-text-primary"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function getBannerContent(state: Exclude<BannerState, 'hidden'>, error: string | null) {
  if (state === 'refresh') {
    return {
      title: 'A private workspace update is ready',
      message: 'Refresh once to activate the latest offline PDF engine cache.',
      Icon: RefreshCw,
    };
  }

  if (state === 'offline') {
    return {
      title: 'Offline mode is active',
      message: 'Cached tools and local files remain available while the network is unavailable.',
      Icon: WifiOff,
    };
  }

  if (state === 'error') {
    return {
      title: 'Offline setup needs attention',
      message: error ?? 'Service worker registration failed.',
      Icon: WifiOff,
    };
  }

  return {
    title: 'App ready to run completely offline',
    message: 'Core app assets and processing dependencies are cached on this device.',
    Icon: RefreshCw,
  };
}
