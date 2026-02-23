'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutDashboard, Bot, Wallet } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { DashboardView } from '@/components/DashboardView';
import { BotsView } from '@/components/BotsView';
import { PayoutsView } from '@/components/PayoutsView';
import { getTranslation } from '@/lib/translations';

// ─── Save FAB ───────────────────────────────────────────────────────────────

type FABState = 'idle' | 'saving' | 'success';

function SaveFAB({ state, visible, onClick }: { state: FABState; visible: boolean; onClick: () => void }) {
    const isSaving = state === 'saving';
    const isSuccess = state === 'success';

    return (
        <button
            onClick={onClick}
            disabled={isSaving}
            aria-label="Save settings"
            style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                flexShrink: 0,
                border: 'none',
                cursor: isSaving ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                pointerEvents: visible ? 'auto' : 'none',
                // Glassmorphism + Telegram accent
                background: isSuccess
                    ? 'linear-gradient(135deg, #30d158, #25a244)'
                    : 'linear-gradient(135deg, color-mix(in srgb, var(--tg-accent, #3390ec) 90%, #fff 10%), var(--tg-accent, #3390ec))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: isSuccess
                    ? '0 4px 20px rgba(48,209,88,0.55), 0 0 0 1px rgba(48,209,88,0.3)'
                    : '0 4px 20px color-mix(in srgb, var(--tg-accent, #3390ec) 55%, transparent), 0 0 0 1px color-mix(in srgb, var(--tg-accent, #3390ec) 40%, transparent)',
                // Appear/disappear
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1) translateX(0)' : 'scale(0.6) translateX(20px)',
                transition: 'opacity 0.35s cubic-bezier(0.22,0.61,0.36,1), transform 0.35s cubic-bezier(0.22,0.61,0.36,1), background 0.4s ease, box-shadow 0.4s ease',
                color: 'white',
            }}
        >
            {/* Sheen overlay */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            {/* Save icon */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    width: 22,
                    height: 22,
                    position: 'absolute',
                    opacity: isSuccess ? 0 : 1,
                    transform: isSaving ? 'scale(0.85)' : 'scale(1)',
                    animation: isSaving ? 'saveSpin 0.9s linear infinite' : 'none',
                    transition: 'opacity 0.25s ease, transform 0.2s ease',
                }}
            >
                {/* Floppy disk outline */}
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                {/* Bottom storage window */}
                <polyline points="17 21 17 13 7 13 7 21" />
                {/* Top label slot */}
                <polyline points="7 3 7 8 15 8" />
            </svg>

            {/* Checkmark icon */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    width: 22,
                    height: 22,
                    position: 'absolute',
                    opacity: isSuccess ? 1 : 0,
                    transform: isSuccess ? 'scale(1)' : 'scale(0.5)',
                    transition: 'opacity 0.3s ease 0.05s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.05s',
                }}
            >
                <polyline
                    points="4 13 9 18 20 7"
                    style={{
                        strokeDasharray: 25,
                        strokeDashoffset: isSuccess ? 0 : 25,
                        transition: 'stroke-dashoffset 0.4s ease 0.1s',
                    }}
                />
            </svg>
        </button>
    );
}

// ─── AppShell ────────────────────────────────────────────────────────────────

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [langCode, setLangCode] = useState<string>('en');
    const [userName, setUserName] = useState<string>('');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);

    // ── Save FAB state (driven by SettingsView via body dataset) ──
    const [fabUnsaved, setFabUnsaved] = useState(false);
    const [fabSaving, setFabSaving] = useState(false);
    const [fabSuccess, setFabSuccess] = useState(false);

    const fabState: FABState = fabSaving ? 'saving' : fabSuccess ? 'success' : 'idle';
    const fabVisible = fabUnsaved || fabSaving || fabSuccess;

    // Watch body dataset for dirty / saving / success flags set by SettingsView
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const sync = () => {
            setFabUnsaved(document.body.dataset.unsaved === 'true');
            setFabSaving(document.body.dataset.saving === 'true');
            setFabSuccess(document.body.dataset.savesuccess === 'true');
        };

        sync(); // initial

        const observer = new MutationObserver(sync);
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-unsaved', 'data-saving', 'data-savesuccess'] });
        return () => observer.disconnect();
    }, []);

    const handleFabClick = useCallback(() => {
        // SettingsView attaches its save handler to window.__handleSave
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

            {/* ── Unified Bottom Bar ── */}
            <div style={{
                position: 'fixed',
                bottom: 24,
                left: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                zIndex: 100,
                pointerEvents: 'none',
            }}>
                {/* Nav pill — shrinks when FAB is visible */}
                <div style={{
                    flex: 1,
                    maxWidth: fabVisible ? 'calc(100% - 60px)' : '300px',
                    transition: 'max-width 0.5s ease-in-out',
                    pointerEvents: 'auto',
                }}>
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
                </div>

                {/* Save FAB */}
                <SaveFAB state={fabState} visible={fabVisible} onClick={handleFabClick} />
            </div>
        </main>
    );
}
