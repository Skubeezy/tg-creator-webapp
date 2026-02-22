'use client';

import { Activity, Users, DollarSign, Bot } from 'lucide-react';
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { TranslationDict } from '@/lib/translations';

export function DashboardView({ API_URL, t }: { API_URL: string, t: TranslationDict }) {
    const [stats, setStats] = useState({
        lifetimeRevenue: 0,
        activeSubs: 0,
        monthlyMrr: 0,
        commissionRate: 10
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (typeof window !== 'undefined' && WebApp.initData) {
                    const res = await fetch(`${API_URL}/me/stats`, {
                        headers: {
                            'Authorization': `Bearer ${WebApp.initData}`
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setStats(data);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch stats", e);
            }
        };
        fetchStats();
    }, [API_URL]);

    return (
        <div className="flex flex-col gap-6 w-full">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)' }}>
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">FanGate</h1>
                        <p className="text-sm opacity-60">{t.creatorDashboard}</p>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #e0f2fe)', color: 'var(--tg-theme-link-color, #2563eb)' }}>
                    {t.proPlan}
                </div>
            </header>

            {/* Main Revenue Card */}
            <div className="tg-card shadow-lg overflow-hidden relative" style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)', color: 'var(--tg-theme-button-text-color, #ffffff)' }}>
                <div className="relative z-10">
                    <p className="opacity-80 text-sm mb-1">{t.lifetimeRevenue}</p>
                    <div className="text-4xl font-black tracking-tight">${stats.lifetimeRevenue.toLocaleString()}</div>
                    <p className="mt-2 text-xs opacity-90">
                        {t.platformCommission}: <span className="font-bold">{stats.commissionRate}%</span> ({t.revenuePrefix}12.5k {t.untilReduction} 5%)
                    </p>
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                        <div className="bg-white h-1.5 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                </div>
                {/* Decor */}
                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12">
                    <DollarSign size={120} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="tg-card flex flex-col gap-2">
                    <div className="flex items-center gap-2 opacity-60">
                        <Users size={18} />
                        <span className="text-sm">{t.activeSubs}</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.activeSubs}</div>
                    <div className="text-xs text-green-500 font-medium">+12 {t.thisWeek}</div>
                </div>

                <div className="tg-card flex flex-col gap-2">
                    <div className="flex items-center gap-2 opacity-60">
                        <Activity size={18} />
                        <span className="text-sm">{t.monthlyMrr}</span>
                    </div>
                    <div className="text-2xl font-bold">${stats.monthlyMrr.toLocaleString()}</div>
                    <div className="text-xs text-green-500 font-medium">+5% {t.growth}</div>
                </div>
            </div>
        </div>
    );
}
