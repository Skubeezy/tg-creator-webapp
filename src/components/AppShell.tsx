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

// ─── Save FAB ─────────────────────────────────────────────────────────────────

type FABState = 'idle' | 'saving' | 'success';

function SaveFAB({ state, visible, onClick }: { state: FABState; visible: boolean; onClick: () => void }) {
    const isSaving = state === 'saving';
    const isSuccess = state === 'success';
    const [showCheck, setShowCheck] = useState(false);

    useEffect(() => {
        if (isSuccess) setShowCheck(true);
        if (!visible) {
            const t = setTimeout(() => setShowCheck(false), 400);
            return () => clearTimeout(t);
        }
    }, [isSuccess, visible]);

    const iconColor = (isSaving || showCheck) ? 'var(--tg-accent, #007aff)' : 'var(--tg-text, currentColor)';
    const iconOpacity = (isSaving || showCheck) ? 1 : 0.62;

    return (
        <button
            className="tab-bar-inner"
            onClick={onClick}
            disabled={isSaving}
            aria-label="Save settings"
            style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                padding: 0,
                flexShrink: 0,
                border: 'none',
                cursor: isSaving ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                pointerEvents: visible ? 'auto' : 'none',
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1) translateX(0)' : 'scale(0.55) translateX(22px)',
                transition: 'opacity 0.28s cubic-bezier(0.22,0.61,0.36,1), transform 0.28s cubic-bezier(0.22,0.61,0.36,1)',
            }}
        >
            {/* Inner sheen */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)',
                pointerEvents: 'none',
            }} />

            {/* Save icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                    width: 22, height: 22, position: 'absolute',
                    opacity: showCheck ? 0 : iconOpacity,
                    transform: isSaving ? 'scale(0.85)' : 'scale(1)',
                    animation: isSaving ? 'saveSpin 0.55s linear infinite' : 'none',
                    transition: 'opacity 0.2s ease, transform 0.15s ease, stroke 0.25s ease',
                }}
            >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
            </svg>

            {/* Checkmark */}
            <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                    width: 22, height: 22, position: 'absolute',
                    opacity: showCheck ? 1 : 0,
                    transform: showCheck ? 'scale(1)' : 'scale(0.4)',
                    transition: 'opacity 0.2s ease 0.05s, transform 0.28s cubic-bezier(0.34,1.56,0.64,1) 0.05s',
                }}
            >
                <polyline points="4 13 9 18 20 7" style={{
                    strokeDasharray: 25,
                    strokeDashoffset: showCheck ? 0 : 25,
                    transition: 'stroke-dashoffset 0.26s ease 0.09s',
                }} />
            </svg>
        </button>
    );
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

    // Save FAB
    const [fabUnsaved, setFabUnsaved] = useState(false);
    const [fabSaving, setFabSaving] = useState(false);
    const [fabSuccess, setFabSuccess] = useState(false);

    const fabState: FABState = fabSaving ? 'saving' : fabSuccess ? 'success' : 'idle';
    const fabVisible = fabUnsaved || fabSaving || fabSuccess;

    // Watch body dataset for FAB signals from SettingsView
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const sync = () => {
            setFabUnsaved(document.body.dataset.unsaved === 'true');
            setFabSaving(document.body.dataset.saving === 'true');
            setFabSuccess(document.body.dataset.savesuccess === 'true');
        };
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-unsaved', 'data-saving', 'data-savesuccess'] });
        return () => observer.disconnect();
    }, []);

    const handleFabClick = useCallback(() => {
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

            // Performance detection — add .perf-low to html element
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
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
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
    const tabLabels = useMemo(() => [t.dashboard, t.myBots, t.payouts], [t]);

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

    return (
        <main className="app-shell">
            <div
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
            <div style={{
                position: 'fixed',
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
                left: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: fabVisible ? 8 : 0,
                zIndex: 100,
                pointerEvents: 'none',
            }}>
                {/* Nav pill */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    pointerEvents: 'auto',
                    transition: isMounted ? 'flex 0.48s ease-in-out' : 'none',
                }}>
                    <div className="tab-bar-inner">
                        <div className="tab-pill" style={{
                            transform: `translateX(${activeIndex * 100}%)`,
                        }} />
                        {icons.map((Icon, idx) => {
                            const isActive = activeIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    className={`tab-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleTabChange(idx)}
                                >
                                    <span className={isActive ? 'tab-icon' : ''}>
                                        <Icon size={24} strokeWidth={isActive ? 2.4 : 1.65} />
                                    </span>
                                    <span>{tabLabels[idx]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Save FAB wrapper */}
                <div style={{
                    width: fabVisible ? 62 : 0,
                    flexShrink: 0,
                    overflow: 'visible',
                    transition: isMounted ? 'width 0.48s ease-in-out' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pointerEvents: 'auto',
                }}>
                    <SaveFAB state={fabState} visible={fabVisible} onClick={handleFabClick} />
                </div>
            </div>
        </main>
    );
}
