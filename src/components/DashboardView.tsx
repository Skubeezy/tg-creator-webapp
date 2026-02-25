'use client';

import { Activity, Users, Bot, TrendingUp, Sparkles, MessageCircle, UserPlus, Settings, ArrowRight, Zap, X, Send } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TranslationDict } from '@/lib/translations';
import { LegalModal } from '@/components/LegalModal';

// ─── Commission Tiers ─────────────────────────────────────────────────────────

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

// ─── Animated Number Counter ──────────────────────────────────────────────────

function AnimatedNum({ value, prefix = '$', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    const [displayed, setDisplayed] = useState(0);
    const rafRef = useRef<number>(0);
    const startRef = useRef<number | null>(null);
    const duration = 900;
    // Skip animation on low-end devices — just show final value immediately
    const isLowEnd = typeof document !== 'undefined' && document.documentElement.classList.contains('perf-low');

    useEffect(() => {
        if (isLowEnd) { setDisplayed(value); return; }
        startRef.current = null;
        cancelAnimationFrame(rafRef.current);
        const to = value;
        const step = (ts: number) => {
            if (!startRef.current) startRef.current = ts;
            const p = Math.min((ts - startRef.current) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplayed(Math.round((to * eased) * 100) / 100);
            if (p < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [value, isLowEnd]);

    return <span>{prefix}{displayed.toLocaleString()}{suffix}</span>;
}

// ─── Avatar Ring ──────────────────────────────────────────────────────────────

function CreatorAvatar({ photoUrl, initials, size = 44 }: { photoUrl: string | null; initials: string; size?: number }) {
    const [failed, setFailed] = useState(false);
    const r = Math.round(size * 0.28);

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            {/* Glow ring */}
            <div style={{
                position: 'absolute',
                inset: -2,
                borderRadius: r + 3,
                background: `linear-gradient(135deg, var(--tg-accent), color-mix(in srgb, var(--tg-accent) 60%, #34c759))`,
                opacity: 0.22,
                animation: 'glowRing 3s ease-in-out infinite',
            }} />
            <div style={{
                width: size, height: size, borderRadius: r,
                overflow: 'hidden', position: 'relative',
                background: 'color-mix(in srgb, var(--tg-accent) 14%, transparent)',
            }}>
                {photoUrl && !failed ? (
                    <img src={photoUrl} alt={initials}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setFailed(true)} />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: Math.round(size * 0.36), fontWeight: 700,
                        color: 'var(--tg-accent)',
                    }}>{initials}</div>
                )}
            </div>
        </div>
    );
}

// ─── DashboardView ────────────────────────────────────────────────────────────

export function DashboardView({ API_URL, t, userName }: { API_URL: string; t: TranslationDict; userName: string }) {
    const [stats, setStats] = useState({ lifetimeRevenue: 0, activeSubs: 0, monthlyMrr: 0, commissionRate: 15, botId: null as string | null });
    const [chartData, setChartData] = useState<any[]>([]);
    const [broadcastText, setBroadcastText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [animated, setAnimated] = useState(false);
    const [botsList, setBotsList] = useState<{ id: string; name: string; username: string }[]>([]);
    const [selectedBroadcastBotId, setSelectedBroadcastBotId] = useState<string | null>(null);
    const [creatorPhotoUrl, setCreatorPhotoUrl] = useState<string | null>(null);
    const [creatorInitials, setCreatorInitials] = useState<string>('?');
    const isRu = t.isRu;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const user = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
            if (user?.photo_url) setCreatorPhotoUrl(user.photo_url);
            const name = user?.first_name || user?.username || '';
            if (name) setCreatorInitials(name.substring(0, 2).toUpperCase());
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const seen = localStorage.getItem('fangate_welcome_seen');
            if (!seen) setShowWelcome(true);
        }
        setTimeout(() => setAnimated(true), 120);
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
                            const ar = await fetch(`${API_URL}/me/bots/${data.botId}/analytics`, {
                                headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                            });
                            if (ar.ok) { const ad = await ar.json(); setChartData(ad.chartData); }
                        }
                    }
                }
            } catch (e) { console.error('Failed to fetch stats', e); }
        };
        fetchStats();
    }, [API_URL]);

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
                WebApp.showAlert(isRu ? `Отправлено ${data.result.successCount} фанатам` : `Sent to ${data.result.successCount} fans`);
                setBroadcastText('');
            } else {
                WebApp.showAlert(data.error || t.networkError);
            }
        } catch { WebApp.showAlert(t.networkError); }
        finally { setIsSending(false); }
    };

    useEffect(() => {
        if (showCommissionModal) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [showCommissionModal]);

    // ─── Welcome ───
    if (showWelcome) {
        return (
            <div className="flex flex-col gap-5 w-full section-enter">
                <div className="flex flex-col items-center text-center gap-5 pt-6">
                    <div style={{
                        width: 72, height: 72, borderRadius: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--tg-accent)',
                        boxShadow: '0 12px 40px color-mix(in srgb, var(--tg-accent) 45%, transparent)',
                        animation: 'logoPulse 2.4s ease-in-out infinite',
                    }}>
                        <Sparkles size={32} color="white" strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className="text-[23px] font-bold" style={{ letterSpacing: '-0.03em', margin: 0 }}>{t.welcomeTitle}</h1>
                        <p className="text-[14px] mt-2 px-4" style={{ color: 'var(--tg-hint)', lineHeight: 1.5 }}>{t.welcomeDesc}</p>
                    </div>
                </div>
                <div className="tg-card !p-0 overflow-hidden">
                    {[
                        { icon: MessageCircle, text: t.welcomeStep1, num: '1', color: 'var(--blue)' },
                        { icon: ArrowRight, text: t.welcomeStep2, num: '2', color: 'var(--green)' },
                        { icon: UserPlus, text: t.welcomeStep3, num: '3', color: 'var(--orange)' },
                        { icon: Settings, text: t.welcomeStep4, num: '4', color: 'var(--purple)' },
                    ].map((step, idx) => (
                        <div key={idx}>
                            <div className="list-row gap-3">
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0,
                                    background: step.color,
                                    boxShadow: `0 4px 12px ${step.color}55`,
                                }}>
                                    {step.num}
                                </div>
                                <span className="text-[14px]" style={{ lineHeight: 1.45 }}>{step.text}</span>
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
            <header className="flex items-center justify-between px-1 py-2"
                style={{ animation: 'sectionIn 0.4s var(--ease-out) both' }}>
                <div className="flex items-center gap-3">
                    <CreatorAvatar photoUrl={creatorPhotoUrl} initials={creatorInitials} size={44} />
                    <div>
                        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{userName}</h1>
                        <p style={{ fontSize: 12, color: 'var(--tg-hint)', margin: 0, marginTop: 1 }}>{t.creatorDashboard}</p>
                    </div>
                </div>
                {/* Commission badge */}
                <button onClick={() => setShowCommissionModal(true)}
                    style={{
                        padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                        background: 'color-mix(in srgb, var(--tg-accent) 11%, transparent)',
                        color: 'var(--tg-accent)', border: '1px solid color-mix(in srgb, var(--tg-accent) 25%, transparent)',
                        transition: 'transform 0.12s ease',
                    }}
                    onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                    onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {tier.rate}% {t.commissionLabel}
                </button>
            </header>

            {/* Revenue Card */}
            <div className="water-card" style={{ animationDelay: '0.05s' }}>
                <div className="water-fill" style={{ height: `${animated ? waterLevel : 0}%` }} />
                <div className="water-content">
                    <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        {t.lifetimeRevenue}
                    </p>
                    <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {animated ? <AnimatedNum value={stats.lifetimeRevenue} /> : '$0'}
                    </div>
                    {nextTier && (
                        <div className="flex items-center gap-1.5 mt-2" style={{ opacity: 0.65, fontSize: 12 }}>
                            <TrendingUp size={12} />
                            <span>{t.nextTier}: {nextTier.rate}% — ${nextTier.min.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Active Subs */}
                <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.1s' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
                            <Users size={14} strokeWidth={2.4} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{t.activeSubs}</span>
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>
                        {animated ? <AnimatedNum value={stats.activeSubs} prefix="" /> : '0'}
                    </div>
                    <div className="flex items-end gap-[3px] mt-3" style={{ height: 28 }}>
                        {[35, 55, 40, 65, 50, 72, 88].map((h, i) => {
                            const barH = stats.activeSubs > 0 ? Math.max(10, Math.min(100, (stats.activeSubs / 10) * h)) : 4;
                            return (
                                <div key={i} className="flex-1 mini-bar"
                                    style={{
                                        height: animated ? `${barH}%` : '0%',
                                        backgroundColor: stats.activeSubs > 0 ? 'rgba(52,199,89,0.28)' : 'var(--tg-separator)',
                                        transitionDelay: `${0.28 + i * 0.05}s`,
                                    }} />
                            );
                        })}
                    </div>
                </div>

                {/* Monthly MRR */}
                <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.18s' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,122,255,0.12)', color: 'var(--blue)' }}>
                            <Activity size={14} strokeWidth={2.4} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{t.monthlyMrr}</span>
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>
                        {animated ? <AnimatedNum value={stats.monthlyMrr} /> : '$0'}
                    </div>
                    <div className="mt-3 relative overflow-hidden" style={{ height: 28 }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <Area type="monotone" dataKey="revenueTotal"
                                        stroke={stats.monthlyMrr > 0 ? 'rgba(0,122,255,0.55)' : 'var(--tg-separator)'}
                                        fill="transparent" strokeWidth={2} isAnimationActive={animated} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <svg className="w-full h-full" viewBox="0 0 100 28" preserveAspectRatio="none">
                                <path d={stats.monthlyMrr > 0 ? "M0 24 L14 18 L28 22 L42 12 L56 16 L70 8 L84 10 L100 4" : "M0 24 L100 24"}
                                    fill="none"
                                    stroke={stats.monthlyMrr > 0 ? 'rgba(0,122,255,0.4)' : 'var(--tg-separator)'}
                                    strokeWidth="2" strokeLinecap="round"
                                    className={`chart-line ${animated ? 'drawn' : ''}`} />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* Broadcast Box */}
            <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
                <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
                        <Send size={15} strokeWidth={2.2} style={{ marginLeft: 2 }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{t.broadcastTitle}</span>
                </div>

                {botsList.length > 0 && (
                    <div className="mb-3">
                        <p style={{ fontSize: 11, color: 'var(--tg-hint)', marginBottom: 8 }}>{t.broadcastSendVia}</p>
                        <div className="flex flex-wrap gap-2">
                            {botsList.map(bot => (
                                <button key={bot.id} onClick={() => setSelectedBroadcastBotId(bot.id)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                                        background: selectedBroadcastBotId === bot.id
                                            ? 'var(--tg-accent)'
                                            : 'color-mix(in srgb, var(--tg-hint) 10%, transparent)',
                                        color: selectedBroadcastBotId === bot.id ? 'white' : 'var(--tg-hint)',
                                        transition: 'background 0.18s, color 0.18s, transform 0.1s',
                                    }}
                                    onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                                    onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {bot.username ? (bot.username.startsWith('@') ? bot.username : `@${bot.username}`) : bot.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <p style={{ fontSize: 13, color: 'var(--tg-hint)', marginBottom: 10, lineHeight: 1.45 }}>{t.broadcastDesc}</p>

                <textarea rows={3}
                    placeholder={t.broadcastPlaceholder}
                    className="tg-input"
                    value={broadcastText}
                    onChange={e => setBroadcastText(e.target.value)}
                    onFocus={() => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        document.body.style.paddingBottom = '38vh';
                    }}
                    onBlur={() => {
                        document.body.style.paddingBottom = '0px';
                        window.scrollTo(0, 0);
                    }}
                    style={{ marginBottom: 6 }}
                />
                <p style={{ fontSize: 11, color: 'var(--tg-hint)', opacity: 0.75, textAlign: 'center', marginBottom: 12 }}>
                    <Sparkles size={11} style={{ display: 'inline', marginRight: 4, position: 'relative', top: -1 }} />
                    {isRu ? 'Текст будет переведён на язык пользователя' : 'Text will be translated to the user\'s language'}
                </p>

                <button
                    onClick={handleSendBroadcast}
                    disabled={isSending || !broadcastText.trim() || !selectedBroadcastBotId}
                    className="action-btn"
                    style={{ fontSize: 14 }}
                >
                    {isSending ? t.broadcastSending : t.broadcastSend}
                </button>
            </div>

            {/* Tier Progress Row */}
            <div className={`tg-card stat-card-anim ${animated ? 'visible' : ''}`} style={{ transitionDelay: '0.4s' }}>
                <button className="flex items-center justify-between w-full" onClick={() => setShowCommissionModal(true)}>
                    <div className="flex items-center gap-3">
                        <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,149,0,0.12)', color: 'var(--orange)' }}>
                            <Zap size={16} strokeWidth={2.2} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, display: 'block' }}>{t.commissionLabel}</span>
                            <span style={{ fontSize: 11, color: 'var(--tg-hint)' }}>
                                {tier.rate}% → {nextTier ? `${nextTier.rate}%` : '5%'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {TIERS.slice(0, 6).map((tr, i) => (
                            <div key={i} style={{
                                width: 7, height: 7, borderRadius: '50%',
                                transition: 'all 0.5s',
                                backgroundColor: stats.lifetimeRevenue >= tr.max ? 'var(--tg-accent)' : 'var(--tg-separator)',
                                transform: stats.lifetimeRevenue >= tr.max ? 'scale(1.2)' : 'scale(1)',
                            }} />
                        ))}
                    </div>
                </button>
            </div>

            {/* Commission Modal */}
            {showCommissionModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.2s ease-out' }}
                    onClick={() => setShowCommissionModal(false)}>
                    <div style={{
                        width: '100%', maxWidth: 340, maxHeight: '85vh',
                        overflowY: 'auto', background: 'var(--tg-bg)',
                        borderRadius: 26, padding: 22, position: 'relative',
                        animation: 'popIn 0.32s cubic-bezier(0.175,0.885,0.32,1.1)',
                    }}
                        onClick={e => e.stopPropagation()}>

                        {/* Decorative blob */}
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'var(--tg-accent)', opacity: 0.07, filter: 'blur(32px)', pointerEvents: 'none' }} />

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--tg-accent) 12%, transparent)', color: 'var(--tg-accent)' }}>
                                    <Zap size={19} strokeWidth={2.5} />
                                </div>
                                <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t.commissionLabel}</h2>
                            </div>
                            <button onClick={() => setShowCommissionModal(false)}
                                style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tg-separator)', transition: 'opacity 0.12s' }}>
                                <X size={15} style={{ color: 'var(--tg-hint)' }} />
                            </button>
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--tg-hint)', marginBottom: 18, lineHeight: 1.5 }}>
                            {isRu ? 'Чем больше вы зарабатываете, тем ниже комиссия.' : 'The more you earn, the lower the platform fee.'}
                        </p>

                        <div className="flex flex-col gap-2">
                            {TIERS.map((tr, idx) => {
                                const isActive = tier.rate === tr.rate;
                                const isPassed = stats.lifetimeRevenue >= tr.max;
                                return (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '11px 14px', borderRadius: 16,
                                        background: isActive ? 'var(--tg-accent)' : 'transparent',
                                        border: isActive ? 'none' : '1px solid var(--tg-separator)',
                                        transition: 'all 0.2s',
                                    }}>
                                        <div className="flex items-center gap-3">
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 13, fontWeight: 800,
                                                background: isActive ? 'rgba(255,255,255,0.18)' : isPassed ? 'rgba(52,199,89,0.12)' : 'color-mix(in srgb, var(--tg-hint) 9%, transparent)',
                                                color: isActive ? '#fff' : isPassed ? 'var(--green)' : 'var(--tg-hint)',
                                            }}>
                                                {tr.rate}%
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : 'var(--tg-text)', display: 'block' }}>
                                                    {tr.max === Infinity ? `$${tr.min.toLocaleString()}+` : `$${tr.min.toLocaleString()} — $${tr.max.toLocaleString()}`}
                                                </span>
                                                {isActive && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.06em' }}>{isRu ? 'ТЕКУЩИЙ' : 'CURRENT'}</span>}
                                            </div>
                                        </div>
                                        {isPassed && !isActive && (
                                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>✓</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button style={{
                            width: '100%', marginTop: 18, padding: '14px', borderRadius: 14,
                            fontWeight: 700, fontSize: 15, background: 'var(--tg-separator)', color: 'var(--tg-text)',
                            transition: 'transform 0.1s',
                        }}
                            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => setShowCommissionModal(false)}>
                            {isRu ? 'Понятно' : 'Got it'}
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Footer Links */}
            <div className="flex items-center justify-center gap-4 mt-2 mb-4" style={{ opacity: 0.65 }}>
                <button onClick={() => setLegalModal('terms')} style={{ fontSize: 12, fontWeight: 500, color: 'var(--tg-link)' }}>
                    {t.termsOfService}
                </button>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--tg-hint)' }} />
                <button onClick={() => setLegalModal('privacy')} style={{ fontSize: 12, fontWeight: 500, color: 'var(--tg-link)' }}>
                    {t.privacyPolicy}
                </button>
            </div>

            <LegalModal type={legalModal} onClose={() => setLegalModal(null)} t={t} />
        </div>
    );
}
