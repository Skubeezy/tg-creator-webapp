'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutDashboard, Bot, Wallet } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { DashboardView } from '@/components/DashboardView';
import { BotsView } from '@/components/BotsView';
import { PayoutsView } from '@/components/PayoutsView';
import { getTranslation } from '@/lib/translations';

// ─── Performance Detection ────────────────────────────────────────────────────

function detectLowEnd(): boolean {
    if (typeof navigator === 'undefined') return false;
    const mem = (navigator as any).deviceMemory;
    const conn = (navigator as any).connection;
    if (mem && mem < 4) return true;
    if (conn?.saveData) return true;
    if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return true;
    return false;
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

const TABS = [
    { Icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Главная' },
    { Icon: Bot, labelEn: 'Bots', labelRu: 'Боты' },
    { Icon: Wallet, labelEn: 'Payouts', labelRu: 'Выплаты' },
];

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);
    const [langCode, setLangCode] = useState<string>('en');
    const [userName, setUserName] = useState<string>('');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Tab width refs for the pill indicator
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const pillRef = useRef<HTMLDivElement>(null);

    // Slide pill on active tab change
    useEffect(() => {
        const activeEl = tabRefs.current[activeIndex];
        const pill = pillRef.current;
        if (!activeEl || !pill) return;
        const { offsetLeft, offsetWidth } = activeEl;
        pill.style.transform = `translateX(${offsetLeft}px)`;
        pill.style.width = `${offsetWidth}px`;
    }, [activeIndex, isMounted]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const user = WebApp.initDataUnsafe?.user;
            if (user?.language_code) setLangCode(user.language_code);
            if (user?.first_name) setUserName(user.first_name);
            else if (user?.username) setUserName(`@${user.username}`);

            try {
                WebApp.expand();
                if (WebApp.disableVerticalSwipes) WebApp.disableVerticalSwipes();
            } catch (_) { }

            if (detectLowEnd()) {
                document.documentElement.classList.add('perf-low');
            }
        }
        try { WebApp.ready(); } catch (_) { }
        const t = setTimeout(() => setIsMounted(true), 920);
        return () => clearTimeout(t);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
        trackRef.current?.classList.add('is-dragging');
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        trackRef.current?.classList.remove('is-dragging');
        if (touchStartX === null || touchStartY === null) return;
        const dx = touchStartX - e.changedTouches[0].clientX;
        const dy = touchStartY - e.changedTouches[0].clientY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 42) {
            if (dx > 0 && activeIndex < 2) { setPrevIndex(activeIndex); setActiveIndex(activeIndex + 1); }
            else if (dx < 0 && activeIndex > 0) { setPrevIndex(activeIndex); setActiveIndex(activeIndex - 1); }
        }

        setTouchStartX(null);
        setTouchStartY(null);
    };

    const t = useMemo(() => getTranslation(langCode), [langCode]);
    const isRu = langCode.startsWith('ru');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tg-creator-saas.vercel.app/api/bots';

    const handleTabChange = useCallback((idx: number) => {
        setPrevIndex(activeIndex);
        setActiveIndex(idx);
    }, [activeIndex]);

    // ─── Launch Screen ───────────────────────────────
    if (!isMounted) {
        return (
            <div className="launch-screen">
                <div className="launch-logo">
                    <Bot size={38} color="white" strokeWidth={1.8} />
                </div>
                <div className="launch-title">FanGate</div>
                <div className="launch-progress">
                    <div className="launch-progress-bar" />
                </div>
            </div>
        );
    }

    return (
        <main className="app-shell">
            <div
                ref={trackRef}
                className="carousel-track hide-scrollbar"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateX(-${activeIndex * 100}vw)`,
                    width: '300vw',
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

            {/* ── Bottom Nav Pill ── */}
            <div className="bottom-bar-wrap">
                <div className="bottom-bar-pill">
                    {/* Sliding active pill indicator */}
                    <div ref={pillRef} className="tab-active-pill" />

                    {TABS.map(({ Icon, labelEn, labelRu }, idx) => {
                        const isActive = activeIndex === idx;
                        return (
                            <button
                                key={idx}
                                ref={el => { tabRefs.current[idx] = el; }}
                                className={`tab-item${isActive ? ' active' : ''}`}
                                onClick={() => handleTabChange(idx)}
                                aria-label={labelEn}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2.4 : 1.6}
                                    className="tab-icon"
                                />
                                <span className="tab-label">
                                    {isRu ? labelRu : labelEn}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
