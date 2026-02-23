'use client';

import { Activity, Users, Bot, TrendingUp, Sparkles, MessageCircle, UserPlus, Settings, ArrowRight, Zap, X, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TranslationDict } from '@/lib/translations';

const TIERS = [
    { rate: 15, min: 0, max: 500 },
    { rate: 10, min: 500, max: 2500 },
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
    return Math.max(5, Math.min(100, progress * 100));
}

export function DashboardView({ API_URL, t, userName }: { API_URL: string, t: TranslationDict, userName: string }) {
    const [stats, setStats] = useState({
        lifetimeRevenue: 0,
        activeSubs: 0,
        monthlyMrr: 0,
        commissionRate: 15,
        botId: null as string | null
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [broadcastText, setBroadcastText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [animated, setAnimated] = useState(false);
    const [botsList, setBotsList] = useState<{ id: string; name: string; username: string }[]>([]);
    const [selectedBroadcastBotId, setSelectedBroadcastBotId] = useState<string | null>(null);
    const isRu = t.isRu;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const seen = localStorage.getItem('fangate_welcome_seen');
            if (!seen) setShowWelcome(true);
        }
        setTimeout(() => setAnimated(true), 100);
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

                        if (data.botId) {
                            const analyticsRes = await fetch(`${API_URL}/me/bots/${data.botId}/analytics`, {
                                headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                            });
                            if (analyticsRes.ok) {
                                const aData = await analyticsRes.json();
                                setChartData(aData.chartData);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch stats", e);
            }
        };
        fetchStats();
    }, [API_URL]);

    // Fetch bots for broadcast selector
    useEffect(() => {
        const fetchBots = async () => {
            if (typeof window === 'undefined' || !WebApp.initData) return;
            try {
                const res = await fetch(`${API_URL}/me/bots`, {
                    headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = (data.bots || []).map((b: any) => ({
                        id: b.id,
                        name: b.settings?.name || b.username || 'Bot',
                        username: b.username || ''
                    }));
                    setBotsList(list);
                    if (list.length > 0) setSelectedBroadcastBotId(list[0].id);
                }
            } catch { }
        };
        fetchBots();
    }, [API_URL]);

    const dismissWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem('fangate_welcome_seen', '1');
    };

    const tier = getCurrentTier(stats.lifetimeRevenue);
    const waterLevel = getWaterLevel(stats.lifetimeRevenue);
    const nextTier = TIERS.find(t => t.rate < tier.rate);

    const handleSendBroadcast = async () => {
        if (!broadcastText.trim() || !selectedBroadcastBotId) return;
        setIsSending(true);
        try {
            const res = await fetch(`${API_URL}/me/bots/${selectedBroadcastBotId}/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                body: JSON.stringify({ text: broadcastText })
            });
            const data = await res.json();
            if (data.success) {
                WebApp.showAlert(`✅ ${isRu ? `Отправлено ${data.result.successCount} фанатам` : `Sent to ${data.result.successCount} fans`}`);
                setBroadcastText('');
            } else {
                WebApp.showAlert(`❌ ${data.error || t.networkError}`);
            }
        } catch {
            WebApp.showAlert(t.networkError);
        } finally {
            setIsSending(false);
        }
    };

    // ─── Welcome ───
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
                <button className="action-btn" onClick={dismissWelcome}>{t.welcomeButton}</button>
            </div>
        );
    }

    // ─── Main Dashboard ───
    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header */}
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
                {/* Commission badge — clickable */}
                <button onClick={() => setShowCommissionModal(true)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--tg-accent) 12%, transparent)', color: 'var(--tg-accent)' }}>
                    {tier.rate}% {t.commissionLabel}
                </button>
            </header>

            {/* Revenue Card with Water */}
            <div className="water-card">
                <div className="water-fill" style={{ height: `${animated ? waterLevel : 0}%` }} />
                <div className="water-content">
                    <p className="text-[12px] font-medium opacity-70 uppercase tracking-wide">{t.lifetimeRevenue}</p>
                    <div className="text-[34px] font-bold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                        ${stats.lifetimeRevenue.toLocaleString()}
                    </div>
                    {nextTier && (
                        <div className="flex items-center gap-1.5 mt-2 opacity-70">
                            <TrendingUp size={13} />
                            <span className="text-[12px]">
                                {t.nextTier}: {nextTier.rate}% — ${nextTier.min.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.1s' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center"
                            style={{ background: 'rgba(52, 199, 89, 0.12)', color: '#34c759' }}>
                            <Users size={14} strokeWidth={2.4} />
                        </div>
                        <span className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>{t.activeSubs}</span>
                    </div>
                    <div className="text-[28px] font-bold" style={{ letterSpacing: '-0.03em' }}>{stats.activeSubs}</div>
                    <div className="flex items-end gap-[3px] mt-3 h-[28px]">
                        {[0, 0, 0, 0, 0, 0, 0].map((_, i) => {
                            const barH = stats.activeSubs > 0
                                ? Math.max(10, Math.min(100, (stats.activeSubs / 10) * [35, 55, 40, 65, 50, 70, 85][i]))
                                : 4;
                            return (
                                <div key={i} className="flex-1 rounded-[2px] mini-bar"
                                    style={{
                                        height: animated ? `${barH}%` : '0%',
                                        backgroundColor: stats.activeSubs > 0 ? 'rgba(52, 199, 89, 0.25)' : 'var(--tg-separator)',
                                        transitionDelay: `${0.3 + i * 0.05}s`
                                    }} />
                            );
                        })}
                    </div>
                </div>

                <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.2s' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center"
                            style={{ background: 'rgba(0, 122, 255, 0.12)', color: '#007aff' }}>
                            <Activity size={14} strokeWidth={2.4} />
                        </div>
                        <span className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>{t.monthlyMrr}</span>
                    </div>
                    <div className="text-[28px] font-bold" style={{ letterSpacing: '-0.03em' }}>${stats.monthlyMrr.toLocaleString()}</div>
                    <div className="mt-3 h-[28px] relative overflow-hidden">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <Area
                                        type="monotone"
                                        dataKey="revenueTotal"
                                        stroke={stats.monthlyMrr > 0 ? 'rgba(0, 122, 255, 0.5)' : 'var(--tg-separator)'}
                                        fill="transparent"
                                        strokeWidth={2}
                                        isAnimationActive={animated}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <svg className="w-full h-full" viewBox="0 0 100 28" preserveAspectRatio="none">
                                <path d={stats.monthlyMrr > 0
                                    ? "M0 24 L14 18 L28 22 L42 12 L56 16 L70 8 L84 10 L100 4"
                                    : "M0 24 L100 24"}
                                    fill="none"
                                    stroke={stats.monthlyMrr > 0 ? 'rgba(0, 122, 255, 0.35)' : 'var(--tg-separator)'}
                                    strokeWidth="2" strokeLinecap="round"
                                    className={`chart-line ${animated ? 'drawn' : ''}`} />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* Broadcast Box */}
            <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.4s' }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                        style={{ background: 'rgba(52, 199, 89, 0.12)', color: '#34c759' }}>
                        <Send size={16} strokeWidth={2.2} className="ml-0.5" />
                    </div>
                    <span className="text-[15px] font-semibold">{t.broadcastTitle}</span>
                </div>

                {/* Bot selector — always show when bots available */}
                {botsList.length > 0 && (
                    <div className="mb-3">
                        <p className="text-[11px] mb-1.5" style={{ color: 'var(--tg-hint)' }}>
                            {t.broadcastSendVia}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {botsList.map(bot => (
                                <button
                                    key={bot.id}
                                    onClick={() => setSelectedBroadcastBotId(bot.id)}
                                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                                    style={{
                                        background: selectedBroadcastBotId === bot.id
                                            ? 'var(--tg-accent)'
                                            : 'color-mix(in srgb, var(--tg-hint) 12%, transparent)',
                                        color: selectedBroadcastBotId === bot.id ? 'white' : 'var(--tg-hint)'
                                    }}
                                >
                                    {bot.username ? (bot.username.startsWith('@') ? bot.username : `@${bot.username}`) : bot.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-[13px] mb-3 leading-snug" style={{ color: 'var(--tg-hint)' }}>
                    {t.broadcastDesc}
                </p>
                <textarea
                    rows={3}
                    placeholder={t.broadcastPlaceholder}
                    className="w-full bg-transparent border border-[var(--tg-separator)] outline-none rounded-[12px] p-3 text-[14px] resize-none mb-3"
                    value={broadcastText}
                    onChange={e => setBroadcastText(e.target.value)}
                    style={{ color: 'var(--tg-text)' }}
                />
                <button
                    onClick={handleSendBroadcast}
                    disabled={isSending || !broadcastText.trim() || !selectedBroadcastBotId}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-white font-semibold text-[15px] disabled:opacity-50 transition-all"
                    style={{ backgroundColor: 'var(--tg-accent)' }}
                >
                    {isSending ? t.broadcastSending : t.broadcastSend}
                </button>
            </div>

            {/* Tier Progress Row */}
            <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.5s' }}>
                <button className="flex items-center justify-between w-full" onClick={() => setShowCommissionModal(true)}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                            style={{ background: 'rgba(255, 149, 0, 0.12)', color: '#ff9500' }}>
                            <Zap size={16} strokeWidth={2.2} />
                        </div>
                        <div className="text-left">
                            <span className="text-[14px] font-medium block">{t.commissionLabel}</span>
                            <span className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>
                                {tier.rate}% → {nextTier ? `${nextTier.rate}%` : '5%'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {TIERS.slice(0, 6).map((tr, i) => (
                            <div key={i} className="w-2 h-2 rounded-full transition-all duration-500"
                                style={{
                                    backgroundColor: stats.lifetimeRevenue >= tr.max
                                        ? 'var(--tg-accent)'
                                        : 'var(--tg-separator)',
                                    transform: stats.lifetimeRevenue >= tr.max ? 'scale(1.2)' : 'scale(1)'
                                }} />
                        ))}
                    </div>
                </button>
            </div>

            {/* ─── Commission Modal ─── */}
            {showCommissionModal && (
                <div className="modal-backdrop" onClick={() => setShowCommissionModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[18px] font-bold">{t.commissionLabel}</h2>
                            <button onClick={() => setShowCommissionModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--tg-separator)' }}>
                                <X size={14} style={{ color: 'var(--tg-hint)' }} />
                            </button>
                        </div>
                        <p className="text-[13px] mb-4" style={{ color: 'var(--tg-hint)' }}>
                            {isRu
                                ? 'Чем больше вы зарабатываете, тем ниже комиссия платформы. Каждый уровень открывается автоматически.'
                                : 'The more you earn, the lower the platform commission. Each tier unlocks automatically.'}
                        </p>
                        <div className="tg-card !p-0 overflow-hidden">
                            {TIERS.map((tr, idx) => {
                                const isActive = tier.rate === tr.rate;
                                const isPassed = stats.lifetimeRevenue >= tr.max;
                                return (
                                    <div key={idx}>
                                        <div className="list-row justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                                                    style={{
                                                        backgroundColor: isActive
                                                            ? 'var(--tg-accent)'
                                                            : isPassed
                                                                ? 'rgba(52, 199, 89, 0.12)'
                                                                : 'var(--tg-separator)',
                                                        color: isActive
                                                            ? 'var(--tg-accent-text)'
                                                            : isPassed
                                                                ? '#34c759'
                                                                : 'var(--tg-hint)'
                                                    }}>
                                                    {tr.rate}%
                                                </div>
                                                <div>
                                                    <span className={`text-[14px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                        {tr.max === Infinity
                                                            ? `$${tr.min.toLocaleString()}+`
                                                            : `$${tr.min.toLocaleString()} — $${tr.max.toLocaleString()}`}
                                                    </span>
                                                    {isActive && (
                                                        <span className="text-[11px] block" style={{ color: 'var(--tg-accent)' }}>
                                                            {isRu ? 'Текущий уровень' : 'Current tier'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isPassed && (
                                                <span className="text-[11px] font-semibold" style={{ color: '#34c759' }}>✓</span>
                                            )}
                                        </div>
                                        {idx < TIERS.length - 1 && <div className="list-separator" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
