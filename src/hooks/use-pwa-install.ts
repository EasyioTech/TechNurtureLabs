'use client';

import { useState, useEffect, useRef } from 'react';

export type PWAPlatform = 'android' | 'ios' | 'desktop' | 'unsupported';

export interface PWAInstallState {
    /** Whether the app is already running as an installed PWA */
    isInstalled: boolean;
    /** Platform-specific install strategy */
    platform: PWAPlatform;
    /** True on Android/Desktop when browser is ready to prompt */
    canPrompt: boolean;
    /** Call this to trigger the native install dialog (Android/Desktop only) */
    prompt: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

function detectPlatform(): PWAPlatform {
    if (typeof window === 'undefined') return 'unsupported';
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    if (isIOS) return 'ios';
    const isAndroid = /android/i.test(ua);
    if (isAndroid) return 'android';
    // Desktop Chrome / Edge also support beforeinstallprompt
    return 'desktop';
}

function detectInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    // Standalone mode = already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    // iOS standalone
    if ((navigator as any).standalone === true) return true;
    return false;
}

export function usePWAInstall(): PWAInstallState {
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState<PWAPlatform>('unsupported');
    const [canPrompt, setCanPrompt] = useState(false);
    // Store the deferred prompt — never expose it outside this hook
    const deferredPrompt = useRef<any>(null);

    useEffect(() => {
        setIsInstalled(detectInstalled());
        setPlatform(detectPlatform());

        // Android / Desktop Chrome: capture the install prompt event
        const handleBeforeInstall = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt.current = e;
            setCanPrompt(true);
        };

        // If app gets installed (e.g. via browser's own button), mark it
        const handleAppInstalled = () => {
            deferredPrompt.current = null;
            setCanPrompt(false);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const prompt = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
        if (!deferredPrompt.current) return 'unavailable';
        try {
            deferredPrompt.current.prompt();
            const { outcome } = await deferredPrompt.current.userChoice;
            deferredPrompt.current = null;
            setCanPrompt(false);
            if (outcome === 'accepted') setIsInstalled(true);
            return outcome === 'accepted' ? 'accepted' : 'dismissed';
        } catch {
            return 'unavailable';
        }
    };

    return { isInstalled, platform, canPrompt, prompt };
}
