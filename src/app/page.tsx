'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Bot, Wallet } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { DashboardView } from '@/components/DashboardView';
import { BotsView } from '@/components/BotsView';
import { PayoutsView } from '@/components/PayoutsView';
import { getTranslation } from '@/lib/translations';

type Tab = 'dashboard' | 'bots' | 'payouts';

const TABS: { id: Tab; icon: typeof LayoutDashboard; labelKey: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    { id: 'bots', icon: Bot, labelKey: 'myBots' },
    { id: 'payouts', icon: Wallet, labelKey: 'payouts' },
];

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [langCode, setLangCode] = useState<string>('en');
    const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevIndex = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 1200);
        if (typeof window !== 'undefined' && WebApp.initDataUnsafe?.user?.language_code) {
            setLangCode(WebApp.initDataUnsafe.user.language_code);
        }
        return () => clearTimeout(timer);
    }, []);

    const t = useMemo(() => getTranslation(langCode), [langCode]);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tg-creator-saas.onrender.com/api/bots";

    const activeIndex = TABS.findIndex(tab => tab.id === activeTab);

    const handleTabChange = (tab: Tab) => {
        if (isAnimating || tab === activeTab) return;
        const newIndex = TABS.findIndex(t => t.id === tab);
        setSlideDir(newIndex > prevIndex.current ? 'left' : 'right');
        setIsAnimating(true);

        setTimeout(() => {
            setActiveTab(tab);
            prevIndex.current = newIndex;
            setTimeout(() => {
                setSlideDir(null);
                setIsAnimating(false);
            }, 30);
        }, 200);
    };

    // ─── Custom Loading Screen ───
    if (!isMounted) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
                style={{ background: 'var(--tg-theme-bg-color, #0f0f0f)' }}>
                {/* Pulsing logo */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse"
                        style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)' }}>
                        <Bot size={44} color="white" />
                    </div>
                    {/* Orbiting dot */}
                    <div className="absolute inset-[-12px] animate-spin" style={{ animationDuration: '1.8s' }}>
                        <div className="w-3 h-3 rounded-full absolute top-0 left-1/2 -translate-x-1/2"
                            style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)' }} />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xl font-bold tracking-tight"
                        style={{ color: 'var(--tg-theme-text-color, #fff)' }}>FanGate</span>
                    <span className="text-xs tracking-widest uppercase opacity-40"
                        style={{ color: 'var(--tg-theme-hint-color, #888)' }}>Loading workspace</span>
                </div>
            </div>
        );
    }

    // Determine animation class
    const getSlideClass = (tabId: Tab) => {
        if (tabId !== activeTab) return 'translate-x-full opacity-0 pointer-events-none absolute inset-0';

        if (slideDir === 'left') return 'animate-slideInLeft';
        if (slideDir === 'right') return 'animate-slideInRight';
        return '';
    };

    return (
        <main className="w-full min-h-screen flex flex-col relative pb-28"
            style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
                color: 'var(--tg-theme-text-color, #000)'
            }}>

            {/* View Container */}
            <div className="flex-1 w-full p-4 overflow-hidden relative">
                {TABS.map(tab => (
                    <div key={tab.id}
                        className={`w-full transition-all duration-200 ease-out ${getSlideClass(tab.id)}`}
                        style={{ display: tab.id === activeTab ? 'block' : 'none' }}>
                        {tab.id === 'dashboard' && <DashboardView API_URL={API_URL} t={t} />}
                        {tab.id === 'bots' && <BotsView API_URL={API_URL} t={t} />}
                        {tab.id === 'payouts' && <PayoutsView t={t} />}
                    </div>
                ))}
            </div>

            {/* ─── Bottom Navigation ─── */}
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[88%] max-w-[380px]">
                <div className="relative flex items-center rounded-2xl p-1.5 shadow-lg backdrop-blur-xl overflow-hidden"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--tg-theme-bg-color, #fff) 85%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--tg-theme-hint-color, #888) 15%, transparent)'
                    }}>

                    {/* Sliding pill */}
                    <div className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
                        style={{
                            width: `calc((100% - 12px) / ${TABS.length})`,
                            transform: `translateX(${activeIndex * 100}%)`,
                            left: '6px',
                            backgroundColor: 'var(--tg-theme-button-color, #2563eb)',
                        }} />

                    {TABS.map((tab, idx) => {
                        const isActive = activeIndex === idx;
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative z-10 transition-all duration-300">
                                <Icon size={22}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                    color={isActive ? 'var(--tg-theme-button-text-color, #fff)' : 'var(--tg-theme-hint-color, #999)'} />
                                <span className="text-[10px] font-semibold"
                                    style={{
                                        color: isActive
                                            ? 'var(--tg-theme-button-text-color, #fff)'
                                            : 'var(--tg-theme-hint-color, #999)'
                                    }}>
                                    {(t as any)[tab.labelKey]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
