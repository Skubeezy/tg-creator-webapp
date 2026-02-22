'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LayoutDashboard, Bot, Wallet } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { DashboardView } from '@/components/DashboardView';
import { BotsView } from '@/components/BotsView';
import { PayoutsView } from '@/components/PayoutsView';
import { getTranslation } from '@/lib/translations';

type Tab = 'dashboard' | 'bots' | 'payouts';

const TAB_IDS: Tab[] = ['dashboard', 'bots', 'payouts'];

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [langCode, setLangCode] = useState<string>('en');

    useEffect(() => {
        if (typeof window !== 'undefined' && WebApp.initDataUnsafe?.user?.language_code) {
            setLangCode(WebApp.initDataUnsafe.user.language_code);
        }
        // Signal to Telegram that WebApp is ready
        try { WebApp.ready(); } catch (_) { }
        // Small delay for the launch screen
        const t = setTimeout(() => setIsMounted(true), 800);
        return () => clearTimeout(t);
    }, []);

    const t = useMemo(() => getTranslation(langCode), [langCode]);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tg-creator-saas.onrender.com/api/bots";

    const tabLabels = useMemo(() => [t.dashboard, t.myBots, t.payouts], [t]);

    const handleTabChange = useCallback((idx: number) => {
        setActiveIndex(idx);
    }, []);

    // ─── Launch Screen ───
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
            {/* Carousel Container — all views side by side, slides via translateX */}
            <div className="carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
                <div className="carousel-slide">
                    <DashboardView API_URL={API_URL} t={t} />
                </div>
                <div className="carousel-slide">
                    <BotsView API_URL={API_URL} t={t} />
                </div>
                <div className="carousel-slide">
                    <PayoutsView t={t} />
                </div>
            </div>

            {/* ─── Telegram-style Bottom Tab Bar ─── */}
            <nav className="tab-bar">
                <div className="tab-bar-inner">
                    {/* Sliding pill background */}
                    <div className="tab-pill" style={{ transform: `translateX(${activeIndex * 100}%)` }} />

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
