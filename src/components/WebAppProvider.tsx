'use client';

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export function WebAppProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Check if we are inside Telegram
        if (typeof window !== 'undefined' && WebApp.initData) {
            WebApp.ready();
            WebApp.expand(); // Expand to full height

            // Auto-adapt colors based on Telegram theme
            const bgColor = WebApp.themeParams.bg_color || '#ffffff';
            const textColor = WebApp.themeParams.text_color || '#000000';

            document.body.style.backgroundColor = bgColor;
            document.body.style.color = textColor;
            document.documentElement.style.setProperty('--tg-theme-bg-color', bgColor);
            document.documentElement.style.setProperty('--tg-theme-text-color', textColor);
        }
        setIsReady(true);
    }, []);

    if (!isReady) return null; // Avoid hydration mismatch

    return (
        <div className="min-h-screen pb-20">
            {/* Bottom padding for Telegram Navigation or MainButton */}
            {children}
        </div>
    );
}
