'use client';

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export function WebAppProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Per telegram-mini-app skill: use tg.themeParams, test in both light/dark
        if (typeof window !== 'undefined') {
            WebApp.ready();
            WebApp.expand(); // Expand to full height for immersive UI

            const params = WebApp.themeParams;
            const bgColor = params.bg_color || '#ffffff';
            const textColor = params.text_color || '#000000';
            const hintColor = params.hint_color || '#999999';
            const linkColor = params.link_color || '#2481cc';
            const buttonColor = params.button_color || '#2481cc';
            const buttonTextColor = params.button_text_color || '#ffffff';
            const secondaryBgColor = params.secondary_bg_color || '#f0f0f0';

            // Set Telegram header color to match the app background
            WebApp.setHeaderColor(bgColor as any);
            WebApp.setBackgroundColor(bgColor as any);

            // Inject all theme variables into CSS root for global access
            const root = document.documentElement;
            root.style.setProperty('--tg-theme-bg-color', bgColor);
            root.style.setProperty('--tg-theme-text-color', textColor);
            root.style.setProperty('--tg-theme-hint-color', hintColor);
            root.style.setProperty('--tg-theme-link-color', linkColor);
            root.style.setProperty('--tg-theme-button-color', buttonColor);
            root.style.setProperty('--tg-theme-button-text-color', buttonTextColor);
            root.style.setProperty('--tg-theme-secondary-bg-color', secondaryBgColor);

            document.body.style.backgroundColor = bgColor;
            document.body.style.color = textColor;
        }
        setIsReady(true);
    }, []);

    if (!isReady) return null; // Avoid hydration mismatch

    return (
        <div className="min-h-screen pb-24">
            {/* Bottom padding accounts for Telegram MainButton */}
            {children}
        </div>
    );
}
