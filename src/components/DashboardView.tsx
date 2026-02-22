'use client';

import { Activity, Users, DollarSign, Bot, TrendingUp } from 'lucide-react';
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
        <div className="flex flex-col gap-5 w-full">
            {/* Header */}
            <header className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)' }}>
                    <Bot size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight">FanGate</h1>
                    <p className="text-xs opacity-50">{t.creatorDashboard}</p>
                </div>
            </header>

            {/* Revenue Card */}
            <div className="tg-card relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, var(--tg-theme-button-color, #2563eb), color-mix(in srgb, var(--tg-theme-button-color, #2563eb) 70%, #000))`,
                    color: 'var(--tg-theme-button-text-color, #fff)'
                }}>
                <div className="relative z-10">
                    <p className="text-xs font-medium opacity-70 uppercase tracking-wider mb-1">{t.lifetimeRevenue}</p>
                    <div className="text-4xl font-black tracking-tighter">
                        ${stats.lifetimeRevenue.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                        <TrendingUp size={14} className="opacity-70" />
                        <span className="text-xs opacity-80">
                            {t.platformCommission}: <span className="font-bold">{stats.commissionRate}%</span>
                        </span>
                    </div>
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1">
                        <div className="bg-white h-1 rounded-full transition-all duration-700" style={{ width: '50%' }} />
                    </div>
                </div>
                {/* Background decoration */}
                <div className="absolute -right-8 -bottom-8 opacity-10 transform rotate-12">
                    <DollarSign size={140} strokeWidth={1} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="tg-card flex flex-col gap-2">
                    <div className="flex items-center gap-2 opacity-50">
                        <Users size={16} strokeWidth={2} />
                        <span className="text-xs font-medium">{t.activeSubs}</span>
                    </div>
                    <div className="text-3xl font-black tracking-tight">{stats.activeSubs}</div>
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--tg-theme-link-color, #34c759)' }}>+12 {t.thisWeek}</div>
                </div>

                <div className="tg-card flex flex-col gap-2">
                    <div className="flex items-center gap-2 opacity-50">
                        <Activity size={16} strokeWidth={2} />
                        <span className="text-xs font-medium">{t.monthlyMrr}</span>
                    </div>
                    <div className="text-3xl font-black tracking-tight">${stats.monthlyMrr.toLocaleString()}</div>
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--tg-theme-link-color, #34c759)' }}>+5% {t.growth}</div>
                </div>
            </div>
        </div>
    );
}
