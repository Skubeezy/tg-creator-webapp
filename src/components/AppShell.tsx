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

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);
    const [langCode, setLangCode] = useState<string>('en');
    const [userName, setUserName] = useState<string>('');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Save state
    const [fabUnsaved, setFabUnsaved] = useState(false);
    const [fabSaving, setFabSaving] = useState(false);
    const [fabSuccess, setFabSuccess] = useState(false);
    const [showCheck, setShowCheck] = useState(false);

    const saveVisible = fabUnsaved || fabSaving || fabSuccess;

    // Pill indicator ref
    const pillRef = useRef<HTMLDivElement>(null);
    const ITEM_W = 54;
    const ITEM_GAP = 4;
    const PAD = 8;

    useEffect(() => {
        const pill = pillRef.current;
        if (!pill) return;
        const left = PAD + activeIndex * (ITEM_W + ITEM_GAP);
        pill.style.left = `${left}px`;
    }, [activeIndex]);

    // Watch body dataset for save signals from SettingsView
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const sync = () => {
            setFabUnsaved(document.body.dataset.unsaved === 'true');
            setFabSaving(document.body.dataset.saving === 'true');
            setFabSuccess(document.body.dataset.savesuccess === 'true');
        };
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-unsaved', 'data-saving', 'data-savesuccess'],
        });
        return () => observer.disconnect();
    }, []);

    // Checkmark auto-hide
    useEffect(() => {
        if (fabSuccess) {
            setShowCheck(true);
            const t = setTimeout(() => setShowCheck(false), 700);
            return () => clearTimeout(t);
        }
    }, [fabSuccess]);

    const handleSaveClick = useCallback(() => {
        if (typeof window !== 'undefined' && (window as any).__handleSave) {
            (window as any).__handleSave();
        }
    }, []);

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
        // Promote to GPU composite layer only while swiping
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

    const icons = [LayoutDashboard, Bot, Wallet];
    const saveColor = fabSuccess ? 'var(--green, #34c759)' : 'var(--tg-accent, #007aff)';

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

            {/* ── Unified Bottom Bar ── */}
            <div className="bottom-bar-wrap">
                <div className={`bottom-bar-pill${saveVisible ? ' has-save' : ''}`}>

                    {/* Nav tabs */}
                    <div className="bottom-bar-nav">
                        {/* Sliding active indicator */}
                        <div
                            ref={pillRef}
                            className="tab-pill"
                            style={{ top: 8, height: 44, width: ITEM_W, left: PAD }}
                        />

                        {icons.map((Icon, idx) => {
                            const isActive = activeIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    className={`tab-item${isActive ? ' active' : ''}`}
                                    onClick={() => handleTabChange(idx)}
                                    aria-label={['Dashboard', 'Bots', 'Payouts'][idx]}
                                >
                                    <span className={isActive ? 'tab-icon' : ''}>
                                        <Icon size={22} strokeWidth={isActive ? 2.4 : 1.7} />
                                    </span>
                                    <span className="tab-dot" />
                                </button>
                            );
                        })}
                    </div>

                    {/* Save chip — slides in from the right */}
                    <div className={`bottom-bar-save${saveVisible ? ' visible' : ''}`}>
                        <div className="bottom-bar-divider" />

                        <button
                            className="save-chip"
                            onClick={handleSaveClick}
                            disabled={fabSaving}
                            aria-label="Save"
                            style={{ color: saveColor }}
                        >
                            {/* Disk icon */}
                            <svg
                                viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                                className={`save-svg${(showCheck || fabSaving) ? ' out' : ''}`}
                            >
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>

                            {/* Spinner */}
                            <svg
                                viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.2"
                                strokeLinecap="round"
                                className={`save-svg save-svg-spin${fabSaving ? ' in' : ''}`}
                            >
                                <circle cx="12" cy="12" r="9" strokeDasharray="14 42" />
                            </svg>

                            {/* Checkmark */}
                            <svg
                                viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round"
                                className={`save-svg${showCheck ? ' in' : ''}`}
                            >
                                <polyline
                                    points="4 13 9 18 20 7"
                                    style={{
                                        strokeDasharray: 28,
                                        strokeDashoffset: showCheck ? 0 : 28,
                                        transition: 'stroke-dashoffset 0.2s ease 0.04s',
                                    }}
                                />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>
        </main>
    );
}
