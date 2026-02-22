'use client';

import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Bot, Wallet } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { DashboardView } from '@/components/DashboardView';
import { BotsView } from '@/components/BotsView';
import { PayoutsView } from '@/components/PayoutsView';
import { getTranslation } from '@/lib/translations';

type Tab = 'dashboard' | 'bots' | 'payouts';

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [langCode, setLangCode] = useState<string>('en');

    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined' && WebApp.initDataUnsafe?.user?.language_code) {
            setLangCode(WebApp.initDataUnsafe.user.language_code);
        }
    }, []);

    const t = useMemo(() => getTranslation(langCode), [langCode]);

    // We keep the central API URL here and pass it down
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tg-creator-saas.onrender.com/api/bots";

    if (!isMounted) return <div className="min-h-screen bg-[#1c242f] flex justify-center items-center text-white">Loading...</div>;

    const tabs = [
        { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
        { id: 'bots', icon: Bot, label: t.myBots },
        { id: 'payouts', icon: Wallet, label: t.payouts }
    ];

    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

    return (
        <main className="w-full min-h-screen flex flex-col relative pb-32" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f4f4f5)', color: 'var(--tg-theme-text-color, #000000)' }}>
            {/* View Container */}
            <div className="flex-1 w-full p-4 overflow-y-auto">
                <div className={`transition-opacity duration-300 ${activeTab === 'dashboard' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                    {activeTab === 'dashboard' && <DashboardView API_URL={API_URL} t={t} />}
                </div>
                <div className={`transition-opacity duration-300 ${activeTab === 'bots' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                    {activeTab === 'bots' && <BotsView API_URL={API_URL} t={t} />}
                </div>
                <div className={`transition-opacity duration-300 ${activeTab === 'payouts' ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                    {activeTab === 'payouts' && <PayoutsView t={t} />}
                </div>
            </div>

            {/* Floating Navigation Pill */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[400px]">
                <div
                    className="relative flex justify-between items-center rounded-[2rem] p-2 shadow-xl border border-black/5 dark:border-white/5 overflow-hidden"
                    style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}
                >

                    {/* Sliding Active Background */}
                    <div
                        className="absolute top-2 bottom-2 rounded-[1.5rem] transition-transform duration-300 ease-out"
                        style={{
                            width: 'calc((100% - 16px) / 3)',
                            transform: `translateX(${activeIndex * 100}%)`,
                            left: '8px',
                            backgroundColor: 'var(--tg-theme-button-color, #2563eb)',
                            opacity: 0.15
                        }}
                    />

                    {tabs.map((tab, idx) => {
                        const isActive = activeIndex === idx;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 relative z-10 transition-colors duration-300"
                                style={{ color: isActive ? 'var(--tg-theme-button-color, #2563eb)' : 'var(--tg-theme-hint-color, #999999)' }}
                            >
                                <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[11px] font-bold ${isActive ? "" : ""}`}>{tab.label}</span>
                            </button>
                        );
                    })}

                </div>
            </div>
        </main>
    );
}
