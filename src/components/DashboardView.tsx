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
                        headers: { 'Authorization': `Bearer ${WebApp.initData}` }
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
        <div className="flex flex-col gap-4 w-full">
            {/* Header */}
            <header className="flex items-center gap-3 px-1 py-2">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white"
                    style={{ backgroundColor: 'var(--tg-accent)' }}>
                    <Bot size={22} strokeWidth={2.2} />
                </div>
                <div>
                    <h1 className="text-[17px] font-semibold leading-tight" style={{ letterSpacing: '-0.02em' }}>FanGate</h1>
                    <p className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>{t.creatorDashboard}</p>
                </div>
            </header>

            {/* Revenue Card — glass with accent gradient overlay */}
            <div className="relative overflow-hidden rounded-[14px] p-4"
                style={{
                    background: `linear-gradient(135deg, var(--tg-accent), color-mix(in srgb, var(--tg-accent) 75%, #1a1a2e))`,
                    color: 'var(--tg-accent-text)'
                }}>
                <div className="relative z-10">
                    <p className="text-[12px] font-medium opacity-80 uppercase tracking-wide">{t.lifetimeRevenue}</p>
                    <div className="text-[34px] font-bold tracking-tight mt-0.5" style={{ letterSpacing: '-0.03em' }}>
                        ${stats.lifetimeRevenue.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 opacity-80">
                        <TrendingUp size={13} />
                        <span className="text-[12px]">
                            {t.platformCommission}: <b>{stats.commissionRate}%</b>
                        </span>
                    </div>
                    <div className="mt-3 w-full rounded-full h-[3px]" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <div className="h-[3px] rounded-full transition-all duration-700" style={{ width: '50%', background: 'rgba(255,255,255,0.8)' }} />
                    </div>
                </div>
                <div className="absolute -right-6 -bottom-6 opacity-[0.08]">
                    <DollarSign size={130} strokeWidth={1} />
                </div>
            </div>

            {/* Stats — iOS grouped list style */}
            <div className="tg-card !p-0 overflow-hidden">
                <div className="list-row justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                            style={{ background: 'rgba(52, 199, 89, 0.12)', color: '#34c759' }}>
                            <Users size={16} strokeWidth={2.2} />
                        </div>
                        <span className="text-[15px]">{t.activeSubs}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[17px] font-semibold">{stats.activeSubs}</span>
                        <p className="text-[11px]" style={{ color: '#34c759' }}>+12 {t.thisWeek}</p>
                    </div>
                </div>
                <div className="list-separator" />
                <div className="list-row justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                            style={{ background: 'rgba(0, 122, 255, 0.12)', color: '#007aff' }}>
                            <Activity size={16} strokeWidth={2.2} />
                        </div>
                        <span className="text-[15px]">{t.monthlyMrr}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[17px] font-semibold">${stats.monthlyMrr.toLocaleString()}</span>
                        <p className="text-[11px]" style={{ color: '#34c759' }}>+5% {t.growth}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
