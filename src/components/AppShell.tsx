'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutDashboard, Bot, Wallet } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { DashboardView } from '@/components/DashboardView';
import { BotsView } from '@/components/BotsView';
import { PayoutsView } from '@/components/PayoutsView';
import { getTranslation } from '@/lib/translations';

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [langCode, setLangCode] = useState<string>('en');
    const [userName, setUserName] = useState<string>('Creator');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const user = WebApp.initDataUnsafe?.user;
            if (user?.language_code) setLangCode(user.language_code);
            if (user?.first_name) setUserName(user.first_name);

            // Override native swipe back on iOS Telegram
            try {
                WebApp.expand();
                if (WebApp.disableVerticalSwipes) {
                    WebApp.disableVerticalSwipes();
                }
            } catch (_) { }
        }
        try { WebApp.ready(); } catch (_) { }
        const t = setTimeout(() => setIsMounted(true), 800);
        return () => clearTimeout(t);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null || touchStartY === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;

        // Ensure it's mostly a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            if (deltaX > 0 && activeIndex < 2) {
                setActiveIndex(activeIndex + 1);
            } else if (deltaX < 0 && activeIndex > 0) {
                setActiveIndex(activeIndex - 1);
            }
        }

        setTouchStartX(null);
        setTouchStartY(null);
    };

    const t = useMemo(() => getTranslation(langCode), [langCode]);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tg-creator-saas.onrender.com/api/bots";
    const tabLabels = useMemo(() => [t.dashboard, t.myBots, t.payouts], [t]);

    const handleTabChange = useCallback((idx: number) => {
        setActiveIndex(idx);
    }, []);

    if (!isMounted) {
        return (
            <div className="launch-screen">
                <div className="launch-logo">
                    <Bot size={36} color="white" strokeWidth={2} />
                </div>
                <div className="launch-text">FanGate</div>
                <div className="launch-spinner" />
            </div>
        );
    }

    return (
        <main className="app-shell">
            <div
                className="carousel-track hide-scrollbar"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateX(-${activeIndex * 100}vw)`,
                    width: '300vw'
                }}
            >
                <div className="carousel-slide">
                    <DashboardView API_URL={API_URL} t={t} userName={userName} />
                </div>
                <div className="carousel-slide">
                    <BotsView API_URL={API_URL} t={t} />
                </div>
                <div className="carousel-slide">
                    <PayoutsView API_URL={API_URL} t={t} />
                </div>
            </div>

            <nav className="tab-bar">
                <div className="tab-bar-inner">
                    <div className="tab-pill" style={{
                        transform: `translateX(${activeIndex * 100}%)`,
                    }} />
                    {[LayoutDashboard, Bot, Wallet].map((Icon, idx) => (
                        <button
                            key={idx}
                            className={`tab-item ${activeIndex === idx ? 'active' : ''}`}
                            onClick={() => handleTabChange(idx)}
                        >
                            <Icon size={24} strokeWidth={activeIndex === idx ? 2.4 : 1.6} />
                            <span>{tabLabels[idx]}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </main>
    );
}
