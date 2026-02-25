'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, Bot, Key, Loader2, CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { TranslationDict } from '@/lib/translations';
import { useRouter } from 'next/navigation';
import WebApp from '@twa-dev/sdk';

type WizardStep = 'token' | 'preview' | 'done';

interface BotData {
    id: string;
    name: string;
    username: string;
    photoUrl?: string;
    plans: { period: string; price: number }[];
}

// ─── Bot Avatar ───────────────────────────────────────────────────────────────

function BotAvatar({ url, name, size = 44 }: { url?: string; name: string; size?: number }) {
    const [failed, setFailed] = useState(false);
    const initials = (name || '?').slice(0, 2).toUpperCase();
    const r = Math.max(10, Math.round(size * 0.32));

    return (
        <div style={{
            width: size, height: size, borderRadius: r, flexShrink: 0,
            overflow: 'hidden', position: 'relative',
            background: 'color-mix(in srgb, var(--tg-accent) 13%, transparent)',
        }}>
            {url && !failed ? (
                <img src={url} alt={name} onError={() => setFailed(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: Math.round(size * 0.34), fontWeight: 700,
                    color: 'var(--tg-accent)',
                }}>
                    {initials}
                </div>
            )}
        </div>
    );
}

// ─── Confetti Burst ───────────────────────────────────────────────────────────

function ConfettiBurst() {
    const pieces = [
        { color: 'var(--blue)', x: '-40px', y: '-50px' },
        { color: 'var(--green)', x: '40px', y: '-48px' },
        { color: 'var(--orange)', x: '-55px', y: '-20px' },
        { color: 'var(--purple)', x: '55px', y: '-22px' },
        { color: '#ff3b30', x: '-28px', y: '-60px' },
        { color: 'var(--teal)', x: '28px', y: '-62px' },
        { color: 'var(--green)', x: '0px', y: '-64px' },
        { color: 'var(--orange)', x: '-44px', y: '12px' },
    ];
    return (
        <>
            {pieces.map((p, i) => (
                <div key={i} className="confetti-piece" style={{
                    background: p.color,
                    left: '50%', top: '50%',
                    '--confetti-end': `translate(${p.x}, ${p.y})`,
                    animationDelay: `${i * 0.04}s`,
                    width: i % 2 === 0 ? 7 : 5,
                    height: i % 2 === 0 ? 7 : 10,
                    borderRadius: i % 3 === 0 ? '50%' : 3,
                } as React.CSSProperties} />
            ))}
        </>
    );
}

// ─── BotsView ─────────────────────────────────────────────────────────────────

export function BotsView({ API_URL, t }: { API_URL: string; t: TranslationDict }) {
    const isRu = t.isRu;
    const router = useRouter();
    const [bots, setBots] = useState<BotData[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState<WizardStep>('token');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [botInfo, setBotInfo] = useState<BotData | null>(null);
    const [error, setError] = useState('');
    const [viewAnim, setViewAnim] = useState('');
    const [animated, setAnimated] = useState(false);
    const syncedRef = useRef(false);

    const fetchBots = async () => {
        try {
            if (typeof window !== 'undefined' && WebApp.initData) {
                const res = await fetch(`${API_URL}/me/bots`, {
                    headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.bots) {
                        setBots(data.bots.map((b: any) => ({
                            id: b.id,
                            name: (b.settings as any)?.name || b.username || 'Bot',
                            username: b.username || '',
                            photoUrl: (b.settings as any)?.photoUrl || undefined,
                            plans: (b.subscriptionPlans || []).map((p: any) => ({
                                period: p.durationDays === 7
                                    ? (isRu ? '1 неделя' : '1 Week')
                                    : p.durationDays === 30
                                        ? (isRu ? '1 месяц' : '1 Month')
                                        : p.durationDays === 90
                                            ? (isRu ? '3 месяца' : '3 Months')
                                            : `${p.durationDays} ${isRu ? 'дн.' : 'days'}`,
                                price: Number(p.price)
                            }))
                        })));
                    }
                }
            }
        } catch (e) { console.error('Failed to load bots', e); }
    };

    useEffect(() => {
        fetchBots().then(() => {
            if (!syncedRef.current && typeof window !== 'undefined' && WebApp.initData) {
                syncedRef.current = true;
                fetch(`${API_URL}/me/bots/sync`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                }).then(r => { if (r.ok) fetchBots(); }).catch(() => { });
            }
        });
        setTimeout(() => setAnimated(true), 80);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, isRu]);

    if (selectedBotId !== null) {
        return (
            <div className="view-enter">
                <SettingsView
                    API_URL={API_URL}
                    botId={selectedBotId}
                    onBack={() => { setViewAnim('view-enter-back'); setSelectedBotId(null); }}
                    onDeleted={() => {
                        setBots(prev => prev.filter(b => b.id !== selectedBotId));
                        setViewAnim('view-enter-back');
                        setSelectedBotId(null);
                        router.refresh();
                    }}
                    t={t}
                />
            </div>
        );
    }

    const handleTokenSubmit = async () => {
        if (!token.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            if (typeof window !== 'undefined' && WebApp.initData) {
                const res = await fetch(`${API_URL}/me/bots`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                    body: JSON.stringify({ token: token.trim() })
                });
                if (res.status === 401) { setError(t.authError); return; }
                const data = await res.json();
                if (data.success && data.bot) {
                    setBotInfo({ id: data.bot.id, name: data.bot.name, username: data.bot.username, photoUrl: data.bot.photoUrl, plans: data.bot.plans });
                    setWizardStep('preview');
                } else {
                    setError(data.message || data.error || `${t.networkError}: ${res.status}`);
                }
            } else { setError(t.webAppNotInit); }
        } catch (e: any) { setError(`${t.networkError}: ${e.message || 'unknown'}`); }
        finally { setIsLoading(false); }
    };

    const handleFinish = () => {
        if (botInfo) setBots(prev => [...prev, botInfo]);
        setWizardStep('done');
        setTimeout(() => {
            setShowWizard(false);
            setWizardStep('token');
            setToken('');
            setBotInfo(null);
            setError('');
            router.refresh();
        }, 1600);
    };

    // ─── Bot Creation Wizard ───
    if (showWizard) {
        return (
            <div className="flex flex-col gap-4 w-full view-enter">
                <header className="flex items-center gap-3 px-1">
                    <button onClick={() => { setShowWizard(false); setWizardStep('token'); setToken(''); setError(''); }}
                        style={{
                            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'color-mix(in srgb, var(--tg-hint) 10%, transparent)',
                        }}>
                        <ArrowLeft size={18} style={{ color: 'var(--tg-accent)' }} />
                    </button>
                    <h1 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{t.createNewBot}</h1>
                </header>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2" style={{ padding: '4px 0' }}>
                    {['token', 'preview', 'done'].map((step, i) => {
                        const stepIdx = ['token', 'preview', 'done'].indexOf(wizardStep);
                        const isPast = i < stepIdx;
                        const isNow = i === stepIdx;
                        return (
                            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: isNow ? 24 : 8, height: 8, borderRadius: 4,
                                    background: isNow ? 'var(--tg-accent)' : isPast ? 'color-mix(in srgb, var(--tg-accent) 45%, transparent)' : 'var(--tg-separator)',
                                    transition: 'all 0.3s var(--ease-spring)',
                                }} />
                            </div>
                        );
                    })}
                </div>

                {wizardStep === 'token' && (
                    <div className="flex flex-col gap-4">
                        <div className="tg-card flex flex-col gap-3">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'color-mix(in srgb, var(--tg-accent) 10%, transparent)',
                                        color: 'var(--tg-accent)',
                                    }}>
                                        <Key size={20} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{t.botTokenLabel}</p>
                                        <p style={{ fontSize: 12, color: 'var(--tg-hint)', margin: 0, marginTop: 2 }}>{t.botTokenHint}</p>
                                    </div>
                                </div>
                                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--tg-accent) 11%, transparent)', color: 'var(--tg-accent)' }}>
                                    @BotFather <ExternalLink size={10} />
                                </a>
                            </div>
                            <input
                                type="text"
                                value={token}
                                onChange={e => { setToken(e.target.value); setError(''); }}
                                placeholder="123456:ABC-DEF1234ghIkl..."
                                className="tg-input"
                                style={{ borderColor: error ? 'var(--red)' : undefined }}
                            />
                            {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
                        </div>
                        <button className="action-btn" onClick={handleTokenSubmit} disabled={!token.trim() || isLoading}>
                            {isLoading ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> : t.connectBot}
                        </button>
                    </div>
                )}

                {wizardStep === 'preview' && botInfo && (
                    <div className="flex flex-col gap-4 view-enter">
                        <div className="tg-card flex flex-col items-center gap-3 py-7">
                            <BotAvatar url={botInfo.photoUrl} name={botInfo.name} size={68} />
                            <div className="text-center">
                                <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{botInfo.name}</p>
                                <p style={{ fontSize: 13, color: 'var(--tg-link)', margin: '4px 0 0' }}>{botInfo.username}</p>
                            </div>
                        </div>

                        <p className="section-header">{t.defaultPlans}</p>
                        <div className="tg-card !p-0 overflow-hidden">
                            {botInfo.plans.map((plan, idx) => (
                                <div key={idx}>
                                    <div className="list-row justify-between">
                                        <span style={{ fontSize: 15 }}>{plan.period}</span>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tg-accent)' }}>${plan.price}</span>
                                    </div>
                                    {idx < botInfo.plans.length - 1 && <div className="list-separator" style={{ marginLeft: 16 }} />}
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--tg-hint)' }}>{t.changePlansLater}</p>
                        <button className="action-btn" onClick={handleFinish}>{t.done}</button>
                    </div>
                )}

                {wizardStep === 'done' && (
                    <div className="tg-card flex flex-col items-center gap-4 py-12 view-enter">
                        <div style={{ position: 'relative' }} className="confetti-wrap">
                            <div style={{
                                width: 60, height: 60, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(52,199,89,0.12)', color: 'var(--green)',
                                animation: 'popIn 0.5s var(--ease-bounce) both',
                            }}>
                                <CheckCircle size={34} strokeWidth={1.6} />
                            </div>
                            <ConfettiBurst />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t.botCreated}</p>
                            <p style={{ fontSize: 13, color: 'var(--tg-hint)', margin: '6px 0 0' }}>
                                {isRu ? 'Всё готово! Настройте бота в следующем экране' : 'All set! Configure your bot next'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Bot List ───
    return (
        <div className={`flex flex-col gap-4 w-full ${viewAnim}`}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.035em', padding: '0 4px', margin: 0 }}>{t.myBots}</h1>

            {/* Add new bot */}
            <div className="tg-card !p-0 overflow-hidden">
                <button
                    className="list-row w-full gap-3"
                    style={{ color: 'var(--tg-accent)' }}
                    onClick={() => { setViewAnim('view-enter'); setShowWizard(true); }}
                >
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'color-mix(in srgb, var(--tg-accent) 10%, transparent)',
                        border: '1.5px dashed color-mix(in srgb, var(--tg-accent) 35%, transparent)',
                        // Subtle pulse to draw attention
                        animation: bots.length === 0 ? 'logoPulse 2.5s ease-in-out infinite' : 'none',
                    }}>
                        <Plus size={22} strokeWidth={2.2} style={{ color: 'var(--tg-accent)' }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{t.createNewBot}</span>
                </button>
            </div>

            {bots.length > 0 && (
                <div className="tg-card !p-0 overflow-hidden">
                    {bots.map((bot, idx) => (
                        <div key={bot.id} className="bot-row-enter" style={{ animationDelay: `${idx * 0.07}s` }}>
                            <button
                                onClick={() => { setViewAnim('view-enter'); setSelectedBotId(bot.id); }}
                                className="list-row w-full justify-between"
                                style={{ position: 'relative', overflow: 'hidden' }}
                            >
                                {/* Left accent stripe */}
                                <div style={{
                                    position: 'absolute', left: 0, top: 8, bottom: 8,
                                    width: 3, borderRadius: '0 3px 3px 0',
                                    background: 'var(--tg-accent)',
                                    opacity: 0.5,
                                }} />
                                <div className="flex items-center gap-3" style={{ paddingLeft: 8 }}>
                                    <BotAvatar url={bot.photoUrl} name={bot.name} size={44} />
                                    <div style={{ textAlign: 'left' }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, display: 'block', lineHeight: 1.2 }}>{bot.name}</span>
                                        {bot.username && (
                                            <span style={{ fontSize: 13, color: 'var(--tg-hint)' }}>
                                                {bot.username.startsWith('@') ? bot.username : `@${bot.username}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={17} style={{ color: 'var(--tg-hint)', opacity: 0.45 }} />
                            </button>
                            {idx < bots.length - 1 && <div className="list-separator" />}
                        </div>
                    ))}
                </div>
            )}

            {bots.length === 0 && animated && (
                <div className="tg-card flex flex-col items-center gap-3 py-12 stat-card-anim visible" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'color-mix(in srgb, var(--tg-hint) 9%, transparent)',
                        animation: 'breathe 3s ease-in-out infinite',
                    }}>
                        <Bot size={28} style={{ color: 'var(--tg-hint)' }} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tg-text)', margin: 0 }}>
                            {isRu ? 'Нет ботов' : 'No bots yet'}
                        </p>
                        <p style={{ fontSize: 13, marginTop: 4, color: 'var(--tg-hint)' }}>
                            {isRu ? 'Создайте первого бота выше' : 'Create your first bot above'}
                        </p>
                    </div>
                </div>
            )}

            <p style={{ fontSize: 12, textAlign: 'center', paddingInline: 24, color: 'var(--tg-hint)' }}>
                {t.botAdminHint}
            </p>
        </div>
    );
}
