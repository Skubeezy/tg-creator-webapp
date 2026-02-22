'use client';

import { Activity, Users, DollarSign, Bot, TrendingUp, Sparkles, MessageCircle, UserPlus, Settings, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { TranslationDict } from '@/lib/translations';

// Commission tiers
const TIERS = [
    { rate: 10, min: 0, max: 2500 },
    { rate: 9, min: 2500, max: 5000 },
    { rate: 8, min: 5000, max: 10000 },
    { rate: 7, min: 10000, max: 25000 },
    { rate: 6, min: 25000, max: 50000 },
    { rate: 5, min: 50000, max: Infinity },
];

function getCurrentTier(revenue: number) {
    return TIERS.find(t => revenue >= t.min && revenue < t.max) || TIERS[TIERS.length - 1];
}

function getWaterLevel(revenue: number): number {
    const tier = getCurrentTier(revenue);
    if (tier.max === Infinity) return 100;
    const progress = (revenue - tier.min) / (tier.max - tier.min);
    return Math.max(3, Math.min(100, progress * 100)); // min 3% so the water is always slightly visible
}

export function DashboardView({ API_URL, t, userName }: { API_URL: string, t: TranslationDict, userName: string }) {
    const [stats, setStats] = useState({
        lifetimeRevenue: 0,
        activeSubs: 0,
        monthlyMrr: 0,
        commissionRate: 10
    });
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Check first-time visit
        if (typeof window !== 'undefined') {
            const seen = localStorage.getItem('fangate_welcome_seen');
            if (!seen) setShowWelcome(true);
        }
    }, []);

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

    const dismissWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem('fangate_welcome_seen', '1');
    };

    const tier = getCurrentTier(stats.lifetimeRevenue);
    const waterLevel = getWaterLevel(stats.lifetimeRevenue);
    const nextTier = TIERS.find(t => t.rate < tier.rate);

    // ─── Welcome / Onboarding ───
    if (showWelcome) {
        return (
            <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col items-center text-center gap-4 pt-6">
                    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center text-white"
                        style={{ backgroundColor: 'var(--tg-accent)' }}>
                        <Sparkles size={32} strokeWidth={1.8} />
                    </div>
                    <h1 className="text-[22px] font-bold" style={{ letterSpacing: '-0.02em' }}>{t.welcomeTitle}</h1>
                    <p className="text-[14px] px-4" style={{ color: 'var(--tg-hint)' }}>{t.welcomeDesc}</p>
                </div>

                <div className="tg-card !p-0 overflow-hidden">
                    {[
                        { icon: MessageCircle, text: t.welcomeStep1, num: '1' },
                        { icon: ArrowRight, text: t.welcomeStep2, num: '2' },
                        { icon: UserPlus, text: t.welcomeStep3, num: '3' },
                        { icon: Settings, text: t.welcomeStep4, num: '4' },
                    ].map((step, idx) => (
                        <div key={idx}>
                            <div className="list-row gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                                    style={{ backgroundColor: 'var(--tg-accent)' }}>
                                    {step.num}
                                </div>
                                <span className="text-[14px]">{step.text}</span>
                            </div>
                            {idx < 3 && <div className="list-separator" />}
                        </div>
                    ))}
                </div>

                <button className="action-btn" onClick={dismissWelcome}>
                    {t.welcomeButton}
                </button>
            </div>
        );
    }

    // ─── Main Dashboard ───
    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header — user name + commission badge */}
            <header className="flex items-center justify-between px-1 py-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white"
                        style={{ backgroundColor: 'var(--tg-accent)' }}>
                        <Bot size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h1 className="text-[17px] font-semibold leading-tight" style={{ letterSpacing: '-0.02em' }}>{userName}</h1>
                        <p className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>{t.creatorDashboard}</p>
                    </div>
                </div>
                {/* Commission badge (where PRO was) */}
                <div className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--tg-accent) 12%, transparent)',
                        color: 'var(--tg-accent)'
                    }}>
                    {tier.rate}% {t.commissionLabel}
                </div>
            </header>

            {/* Revenue Card with Water Animation */}
            <div className="water-card">
                <div className="water-fill" style={{ height: `${waterLevel}%` }}>
                    <div className="water-wave" />
                </div>
                <div className="water-content">
                    <p className="text-[12px] font-medium opacity-80 uppercase tracking-wide">{t.lifetimeRevenue}</p>
                    <div className="text-[34px] font-bold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                        ${stats.lifetimeRevenue.toLocaleString()}
                    </div>
                    {nextTier && (
                        <div className="flex items-center gap-1.5 mt-2 opacity-80">
                            <TrendingUp size={13} />
                            <span className="text-[12px]">
                                {t.nextTier}: {nextTier.rate}% — ${nextTier.min.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
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
