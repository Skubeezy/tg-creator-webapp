'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

    const trackRef = useRef<HTMLDivElement>(null);

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

    const handleScroll = useCallback(() => {
        if (!trackRef.current) return;
        const scrollLeft = trackRef.current.scrollLeft;
        const width = trackRef.current.clientWidth;
        const index = Math.round(scrollLeft / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    }, [activeIndex]);

    const t = useMemo(() => getTranslation(langCode), [langCode]);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tg-creator-saas.onrender.com/api/bots";
    const tabLabels = useMemo(() => [t.dashboard, t.myBots, t.payouts], [t]);

    const handleTabChange = useCallback((idx: number) => {
        setActiveIndex(idx);
        if (trackRef.current) {
            trackRef.current.scrollTo({ left: idx * window.innerWidth, behavior: 'smooth' });
        }
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
                ref={trackRef}
                className="carousel-track hide-scrollbar"
                onScroll={handleScroll}
                style={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <div className="carousel-slide" style={{ minWidth: '100vw', width: '100vw', scrollSnapAlign: 'start' }}>
                    <DashboardView API_URL={API_URL} t={t} userName={userName} />
                </div>
                <div className="carousel-slide" style={{ minWidth: '100vw', width: '100vw', scrollSnapAlign: 'start' }}>
                    <BotsView API_URL={API_URL} t={t} />
                </div>
                <div className="carousel-slide" style={{ minWidth: '100vw', width: '100vw', scrollSnapAlign: 'start' }}>
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
