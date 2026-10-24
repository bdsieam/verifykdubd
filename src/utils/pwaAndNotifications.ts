import { useEffect, useState } from 'react';
import { SubmittedApplication } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function usePushNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'default'
  );

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return permission;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
  };
}

/**
 * Triggers a native OS / Mobile Notification Bar push alert via the Service Worker
 * (or fallback Notification constructor) so the Representative receives an OS-level
 * notification banner & vibration even when the tab is minimized or backgrounded.
 */
export async function sendSystemPushNotification(
  app: SubmittedApplication,
  onClickCallback?: () => void
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  let currentPerm = Notification.permission;
  if (currentPerm === 'default') {
    try {
      currentPerm = await Notification.requestPermission();
    } catch {
      return false;
    }
  }

  if (currentPerm !== 'granted') {
    return false;
  }

  const title = `নতুন ভেরিফিকেশন আবেদন: ${app.formData.fullName}`;
  const body = `${app.formData.program}${
    app.formData.studentId ? ` · ID: ${app.formData.studentId}` : ''
  } (${app.referenceId}) — ট্যাপ করে চেক ও Approve করুন`;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `kdu-verify-${app.referenceId}`,
          renotify: true,
          vibrate: [200, 100, 200, 100, 300],
          data: {
            referenceId: app.referenceId,
          },
        } as NotificationOptions);
        return true;
      }
    }

    const notif = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: `kdu-verify-${app.referenceId}`,
    });
    notif.onclick = () => {
      window.focus();
      if (onClickCallback) onClickCallback();
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}
