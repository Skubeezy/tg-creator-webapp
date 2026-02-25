'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Tag, Trash2, PlusCircle, Check, ChevronDown, MessageSquare, Sparkles, Radio, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { TranslationDict } from '@/lib/translations';

interface Plan {
    id?: string;
    durationDays: number;
    price: number;
    currency?: string;
    isNew?: boolean;
    isChanged?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

// ─── Duration options ─────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
    { days: 1, labelRu: '1 день', labelEn: '1 day' },
    { days: 7, labelRu: '1 неделя', labelEn: '1 week' },
    { days: 30, labelRu: '1 месяц', labelEn: '1 month' },
    { days: 90, labelRu: '3 месяца', labelEn: '3 months' },
    { days: 180, labelRu: '6 месяцев', labelEn: '6 months' },
    { days: 365, labelRu: '1 год', labelEn: '1 year' },
];

// ─── Duration Picker ──────────────────────────────────────────────────────────
function DurationPicker({ value, onChange, isRu }: { value: number; onChange: (days: number) => void; isRu: boolean }) {
    const [open, setOpen] = useState(false);
    const selected = DURATION_OPTIONS.find(o => o.days === value) || DURATION_OPTIONS[2];

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [open]);

    return (
        <div style={{ flex: 1 }}>
            <button type="button" onClick={() => setOpen(true)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', borderRadius: 14,
                background: 'color-mix(in srgb, var(--tg-hint) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--tg-hint) 12%, transparent)',
                color: 'var(--tg-text)', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', transition: 'transform 0.1s, background 0.15s',
            }}
                onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <span>{isRu ? selected.labelRu : selected.labelEn}</span>
                <ChevronDown size={15} style={{ color: 'var(--tg-hint)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
            </button>

            {open && typeof document !== 'undefined' && require('react-dom').createPortal(
                <div className="fixed inset-0 z-[99999] flex flex-col justify-end"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }}
                    onClick={() => setOpen(false)}>
                    <div style={{
                        background: 'var(--tg-bg)', borderRadius: '28px 28px 0 0',
                        padding: '20px 16px 40px',
                        animation: 'slideUp 0.32s var(--ease-out)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--tg-separator)', margin: '0 auto 20px', opacity: 0.6 }} />
                        <h3 style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', marginBottom: 18, color: 'var(--tg-text)', letterSpacing: '-0.02em' }}>
                            {isRu ? 'Продолжительность' : 'Duration'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {DURATION_OPTIONS.map((opt) => {
                                const isSel = opt.days === value;
                                return (
                                    <button key={opt.days} type="button"
                                        onClick={() => { onChange(opt.days); setOpen(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 16px', borderRadius: 16,
                                            background: isSel ? 'color-mix(in srgb, var(--tg-accent) 10%, transparent)' : 'color-mix(in srgb, var(--tg-hint) 5%, transparent)',
                                            color: isSel ? 'var(--tg-accent)' : 'var(--tg-text)',
                                            border: isSel ? '1.5px solid color-mix(in srgb, var(--tg-accent) 28%, transparent)' : '1px solid transparent',
                                            transition: 'all 0.15s', fontSize: 16, fontWeight: isSel ? 700 : 500,
                                            fontFamily: 'inherit', cursor: 'pointer',
                                        }}>
                                        <span>{isRu ? opt.labelRu : opt.labelEn}</span>
                                        {isSel && <Check size={18} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ─── Price Picker ─────────────────────────────────────────────────────────────
const PRICE_MIN = 1;
const PRICE_MAX = 200;

function PricePicker({ value, onChange, isRu }: { value: number; onChange: (price: number) => void; isRu: boolean }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);

    const handleOpen = () => { setDraft(value); setOpen(true); };
    const handleAccept = () => { onChange(draft); setOpen(false); };

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [open]);

    useEffect(() => { setDraft(value); }, [value]);

    const pct = ((draft - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

    const tickCount = 10;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i / tickCount);

    return (
        <>
            <button type="button" onClick={handleOpen} style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '11px 14px', borderRadius: 14, flexShrink: 0,
                background: 'color-mix(in srgb, var(--tg-accent) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--tg-accent) 22%, transparent)',
                fontFamily: 'inherit', cursor: 'pointer', transition: 'transform 0.1s',
            }}
                onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <span style={{ fontWeight: 700, color: 'var(--tg-accent)', fontSize: 15 }}>$</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--tg-text)', minWidth: 28, textAlign: 'right' }}>{value}</span>
            </button>

            {open && typeof document !== 'undefined' && require('react-dom').createPortal(
                <div className="fixed inset-0 z-[99999] flex flex-col justify-end"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease-out' }}
                    onClick={handleAccept}>
                    <div style={{
                        background: 'var(--tg-bg)', borderRadius: '28px 28px 0 0',
                        padding: '20px 24px 44px',
                        boxShadow: '0 -8px 48px rgba(0,0,0,0.22)',
                        animation: 'slideUp 0.34s var(--ease-out)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--tg-separator)', margin: '0 auto 20px', opacity: 0.6 }} />
                        <p style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--tg-text)', marginBottom: 28 }}>
                            {isRu ? 'Стоимость подписки' : 'Subscription Price'}
                        </p>

                        <div style={{ textAlign: 'center', marginBottom: 36 }}>
                            <span style={{
                                fontSize: 56, fontWeight: 800, letterSpacing: '-0.05em',
                                color: 'var(--tg-accent)', display: 'inline-block',
                                transition: 'transform 0.1s var(--ease-bounce)',
                            }}>
                                ${draft}
                            </span>
                            <span style={{ fontSize: 14, color: 'var(--tg-hint)', display: 'block', marginTop: 2 }}>
                                {isRu ? 'за период' : 'per period'}
                            </span>
                        </div>

                        <div style={{ position: 'relative', marginBottom: 10 }}>
                            <div style={{ height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--tg-hint) 14%, transparent)', position: 'relative', overflow: 'hidden', marginBottom: 8 }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--tg-accent)', borderRadius: 3, transition: 'width 0.05s ease' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginBottom: 4 }}>
                                {ticks.map((t, i) => {
                                    const tickVal = Math.round(PRICE_MIN + t * (PRICE_MAX - PRICE_MIN));
                                    const isActive = draft >= tickVal;
                                    return (
                                        <div key={i} style={{
                                            width: 2, height: i % 5 === 0 ? 8 : 5, borderRadius: 1,
                                            background: isActive ? 'var(--tg-accent)' : 'color-mix(in srgb, var(--tg-hint) 20%, transparent)',
                                            transition: 'background 0.06s',
                                        }} />
                                    );
                                })}
                            </div>
                            <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={1}
                                value={draft}
                                onChange={e => {
                                    setDraft(Number(e.target.value));
                                    try { WebApp.HapticFeedback.selectionChanged(); } catch (_) { }
                                }}
                                className="price-range"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0, padding: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                            <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>${PRICE_MIN}</span>
                            <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>${PRICE_MAX}</span>
                        </div>
                        <button className="action-btn" onClick={handleAccept}>{isRu ? 'Готово' : 'Done'}</button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ─── SettingsView ─────────────────────────────────────────────────────────────

export function SettingsView({ API_URL, botId, onBack, onDeleted, t }: { API_URL: string; botId: string; onBack: () => void; onDeleted: () => void; t: TranslationDict }) {
    const isRu = t.isRu;
    const router = require('next/navigation').useRouter();

    const [welcomeText, setWelcomeText] = useState('');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [channels, setChannels] = useState<Array<{ id: string; telegramChatId: string; title: string | null }>>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    // Refs for auto-save payload — always up-to-date without stale closures
    const welcomeRef = useRef(welcomeText);
    const plansRef = useRef(plans);
    const channelRef = useRef(selectedChannelId);
    useEffect(() => { welcomeRef.current = welcomeText; }, [welcomeText]);
    useEffect(() => { plansRef.current = plans; }, [plans]);
    useEffect(() => { channelRef.current = selectedChannelId; }, [selectedChannelId]);

    // Debounce timer ref
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Save status display ──
    const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showSaved = () => {
        setSaveStatus('saved');
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setSaveStatus('idle'), 2200);
    };

    // ── Core save function ───────────────────────────────────────────────────
    const performSave = useCallback(async () => {
        if (!WebApp.initData) return;
        setSaveStatus('saving');

        try {
            // 1. Welcome text
            await fetch(`${API_URL}/me/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                body: JSON.stringify({ welcomeText: welcomeRef.current }),
            });

            // 2. Selected channel
            const cid = channelRef.current;
            if (cid) {
                await fetch(`${API_URL}/me/bots/${botId}/channel`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                    body: JSON.stringify({ channelId: cid }),
                });
            }

            // 3. Plans
            const currentPlans = plansRef.current;
            const updatedPlans: Plan[] = [...currentPlans];
            for (let i = 0; i < currentPlans.length; i++) {
                const plan = currentPlans[i];
                if (plan.isNew) {
                    const res = await fetch(`${API_URL}/me/bots/${botId}/plans`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                        body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price, currency: plan.currency || 'USD' }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        updatedPlans[i] = { ...data.plan, price: Number(data.plan.price), isNew: false, isChanged: false };
                    }
                } else if (plan.id && plan.isChanged) {
                    await fetch(`${API_URL}/me/plans/${plan.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                        body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price, currency: plan.currency || 'USD' }),
                    });
                    updatedPlans[i] = { ...updatedPlans[i], isChanged: false };
                }
            }
            setPlans(updatedPlans);
            showSaved();
        } catch (e) {
            console.error('[SettingsView] auto-save error:', e);
            setSaveStatus('idle');
        }
    }, [API_URL, botId]);

    // ── Debounced trigger ────────────────────────────────────────────────────
    const triggerAutoSave = useCallback((delayMs = 800) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(performSave, delayMs);
    }, [performSave]);

    // Immediate save (for channel select, plan delete)
    const triggerImmediateSave = useCallback(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        performSave();
    }, [performSave]);

    // ── Load data ────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (typeof window === 'undefined' || !WebApp.initData) return;
        try {
            const res = await fetch(`${API_URL}/me/bots`, {
                headers: { 'Authorization': `Bearer ${WebApp.initData}` }
            });
            if (res.ok) {
                const data = await res.json();
                const bot = data.bots?.find((b: any) => b.id === botId);
                if (bot) {
                    const rawPlans = (bot.subscriptionPlans || []).map((p: any) => ({
                        id: p.id, durationDays: p.durationDays, price: Number(p.price), currency: 'USD'
                    })).sort((a: Plan, b: Plan) => a.durationDays - b.durationDays);
                    setPlans(rawPlans);

                    const rawChannels = (bot.channels || []).map((c: any) => ({
                        id: c.id, telegramChatId: c.telegramChatId?.toString() ?? '', title: c.title || null,
                    }));
                    setChannels(rawChannels);
                    const storedChannelId = (bot.settings as any)?.selectedChannelId ?? (rawChannels[0]?.id ?? null);
                    setSelectedChannelId(storedChannelId);

                    const bs = bot.settings as any;
                    const wText = bs?.welcomeText || bs?.welcomeTextEn || bs?.welcomeTextRu || (isRu ? 'Добро пожаловать!' : 'Welcome!');
                    setWelcomeText(wText);
                }
            }
        } catch (e) { console.error('Failed to load bot data', e); }
    }, [API_URL, botId, isRu]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { if (typeof window !== 'undefined') WebApp.MainButton.hide(); }, []);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            if (statusTimer.current) clearTimeout(statusTimer.current);
        };
    }, []);

    // ── Delete plan ──────────────────────────────────────────────────────────
    const handleDeletePlan = async (index: number) => {
        const plan = plans[index];
        if (plan.id && !plan.isNew) {
            WebApp.showConfirm(t.deletePlanConfirm, async (confirm) => {
                if (confirm) {
                    try {
                        const res = await fetch(`${API_URL}/me/plans/${plan.id}`, {
                            method: 'DELETE', headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                        });
                        if (res.ok) {
                            setPlans(p => p.filter((_, i) => i !== index));
                            router.refresh();
                        }
                    } catch { }
                }
            });
        } else {
            setPlans(plans.filter((_, i) => i !== index));
        }
    };

    const handleDeleteBot = () => {
        WebApp.showConfirm(t.deleteBotConfirm, async (confirm) => {
            if (confirm && WebApp.initData) {
                try {
                    const res = await fetch(`${API_URL}/me/bots/${botId}`, {
                        method: 'DELETE', headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                    });
                    if (res.ok) { onDeleted(); router.refresh(); }
                    else WebApp.showAlert(isRu ? 'Ошибка удаления бота' : 'Error deleting bot');
                } catch { WebApp.showAlert(isRu ? 'Ошибка сети' : 'Network error'); }
            }
        });
    };

    // ─── Section style helpers ───
    const sectionStyle: React.CSSProperties = {
        borderRadius: 20,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '0.5px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        position: 'relative',
        overflow: 'hidden',
    };

    const sectionHeaderStyle: React.CSSProperties = {
        padding: '14px 16px',
        borderBottom: '0.5px solid color-mix(in srgb, var(--tg-hint) 9%, transparent)',
        display: 'flex', alignItems: 'center', gap: 10,
    };

    function iconBox(color: string, bg: string): React.CSSProperties {
        return { width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color };
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', paddingBottom: 100 }}>

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}
                className="section-enter">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={onBack} style={{
                        width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'color-mix(in srgb, var(--tg-hint) 9%, transparent)',
                        color: 'var(--tg-accent)', transition: 'transform 0.1s',
                    }}
                        onPointerDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                        onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: 21, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
                        {t.botSettings}
                    </h1>
                </div>

                {/* Auto-save status indicator */}
                <div
                    className={`save-status-pill ${saveStatus === 'saving' ? 'saving' : saveStatus === 'saved' ? 'saved' : 'hidden'}`}
                    style={{ flexShrink: 0 }}
                >
                    {saveStatus === 'saving' ? (
                        <>
                            <Loader2 size={12} className="spin-icon" />
                            {isRu ? 'Сохраняем…' : 'Saving…'}
                        </>
                    ) : saveStatus === 'saved' ? (
                        <>
                            <CheckCircle2 size={12} />
                            {isRu ? 'Сохранено' : 'Saved'}
                        </>
                    ) : null}
                </div>
            </header>

            {/* Welcome Message */}
            <section style={{ ...sectionStyle, animation: 'sectionIn 0.4s var(--ease-spring) 0.05s both' }}>
                <div style={sectionHeaderStyle}>
                    <div style={iconBox('var(--tg-accent)', 'color-mix(in srgb, var(--tg-accent) 10%, transparent)')}>
                        <MessageSquare size={16} strokeWidth={2} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t.welcomeMessage}</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                    <textarea
                        className="tg-input"
                        style={{ minHeight: 88, lineHeight: 1.5, fontSize: 14, resize: 'none' }}
                        value={welcomeText}
                        onChange={e => {
                            setWelcomeText(e.target.value);
                            triggerAutoSave(900);
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--tg-accent)'}
                        onBlur={e => {
                            e.target.style.borderColor = 'color-mix(in srgb, var(--tg-hint) 12%, transparent)';
                            window.scrollTo(0, 0);
                            // Flush save on blur
                            if (saveTimer.current) {
                                clearTimeout(saveTimer.current);
                                performSave();
                            }
                        }}
                    />
                    <p style={{ fontSize: 11, color: 'var(--tg-hint)', marginTop: 8, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.75 }}>
                        <Sparkles size={11} />{t.autoTranslateHint}
                    </p>
                </div>
            </section>

            {/* Connected Channel */}
            <section style={{ ...sectionStyle, animation: 'sectionIn 0.4s var(--ease-spring) 0.1s both' }}>
                <div style={sectionHeaderStyle}>
                    <div style={iconBox('var(--purple)', 'rgba(88,86,214,0.1)')}>
                        <Radio size={16} strokeWidth={2} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{isRu ? 'Канал' : 'Channel'}</span>
                </div>
                <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {channels.length === 0 ? (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                            borderRadius: 14, background: 'rgba(255,59,48,0.06)',
                            border: '1px solid rgba(255,59,48,0.18)',
                        }}>
                            <AlertCircle size={17} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 13, color: 'var(--red)', lineHeight: 1.45 }}>
                                {isRu
                                    ? 'Бот не добавлен ни в один канал. Добавьте бота как администратора.'
                                    : 'Bot is not in any channel. Add the bot as an admin to a channel.'}
                            </span>
                        </div>
                    ) : (
                        channels.map((ch) => {
                            const isSel = selectedChannelId === ch.id;
                            return (
                                <button key={ch.id} type="button" onClick={() => {
                                    setSelectedChannelId(ch.id);
                                    // Immediate save on channel select
                                    setTimeout(() => triggerImmediateSave(), 0);
                                }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '13px 14px', borderRadius: 16, textAlign: 'left',
                                        background: isSel ? 'color-mix(in srgb, var(--tg-accent) 9%, transparent)' : 'color-mix(in srgb, var(--tg-hint) 5%, transparent)',
                                        border: isSel ? '1.5px solid color-mix(in srgb, var(--tg-accent) 32%, transparent)' : '1px solid transparent',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'background 0.18s, border-color 0.18s, transform 0.1s',
                                    }}
                                    onPointerDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                    onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {/* Animated radio dot */}
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                        border: isSel ? '2px solid var(--tg-accent)' : '2px solid color-mix(in srgb, var(--tg-hint) 35%, transparent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'border-color 0.18s',
                                    }}>
                                        <div style={{
                                            width: isSel ? 10 : 0, height: isSel ? 10 : 0,
                                            borderRadius: '50%', background: 'var(--tg-accent)',
                                            transition: 'width 0.2s var(--ease-spring), height 0.2s var(--ease-spring)',
                                        }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 15, fontWeight: isSel ? 600 : 400, color: isSel ? 'var(--tg-accent)' : 'var(--tg-text)', transition: 'color 0.18s' }}>
                                            {ch.title || (isRu ? 'Без названия' : 'Unnamed Channel')}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 2 }}>ID: {ch.telegramChatId}</div>
                                    </div>
                                    {isSel && <Check size={15} style={{ color: 'var(--tg-accent)', flexShrink: 0 }} strokeWidth={2.5} />}
                                </button>
                            );
                        })
                    )}
                    {channels.length > 0 && (
                        <p style={{ fontSize: 11, color: 'var(--tg-hint)', paddingLeft: 4, marginTop: 2, opacity: 0.7 }}>
                            {isRu ? 'Выберите канал для открытия доступа после оплаты' : 'Select the channel fans get access to after payment'}
                        </p>
                    )}
                </div>
            </section>

            {/* Subscription Plans */}
            <section style={{ ...sectionStyle, zIndex: 10, animation: 'sectionIn 0.4s var(--ease-spring) 0.15s both' }}>
                <div style={sectionHeaderStyle}>
                    <div style={iconBox('var(--green)', 'rgba(52,199,89,0.1)')}>
                        <Tag size={16} strokeWidth={2} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t.subscriptionPlansSection}</span>
                </div>
                <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plans.map((plan, i) => (
                        <div key={plan.id || i} style={{
                            padding: '12px 14px', borderRadius: 16,
                            background: 'color-mix(in srgb, var(--tg-hint) 5%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--tg-hint) 9%, transparent)',
                            display: 'flex', flexDirection: 'column', gap: 10,
                            animation: 'listItemIn 0.36s var(--ease-spring) both',
                            animationDelay: `${i * 0.06}s`,
                            position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute', left: 0, top: 16, bottom: 16,
                                width: 3, borderRadius: '0 3px 3px 0',
                                background: 'var(--green)', opacity: 0.5,
                            }} />
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 8 }}>
                                <DurationPicker value={plan.durationDays} isRu={isRu}
                                    onChange={days => {
                                        const p = [...plans];
                                        p[i] = { ...p[i], durationDays: days, isChanged: true };
                                        setPlans(p);
                                        triggerAutoSave();
                                    }} />
                                <PricePicker value={plan.price} isRu={isRu}
                                    onChange={price => {
                                        const p = [...plans];
                                        p[i] = { ...p[i], price, isChanged: true };
                                        setPlans(p);
                                        triggerAutoSave();
                                    }} />
                                <button onClick={() => handleDeletePlan(i)} style={{
                                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                                    background: 'rgba(255,59,48,0.08)', color: 'var(--red)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'transform 0.1s, background 0.15s',
                                }}
                                    onPointerDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
                                    onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Trash2 size={15} strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button onClick={() => {
                        const newPlan: Plan = { durationDays: 30, price: 10, currency: 'USD', isNew: true };
                        setPlans(p => [...p, newPlan]);
                        triggerAutoSave(600);
                    }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '13px', borderRadius: 16,
                            border: '1.5px dashed color-mix(in srgb, var(--tg-accent) 30%, transparent)',
                            background: 'color-mix(in srgb, var(--tg-accent) 4%, transparent)',
                            color: 'var(--tg-accent)', fontSize: 14, fontWeight: 600,
                            fontFamily: 'inherit', transition: 'background 0.15s, transform 0.1s',
                        }}
                        onPointerDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                        onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <PlusCircle size={17} />
                        {t.addPlan}
                    </button>
                </div>
            </section>

            {/* Danger Zone */}
            <section style={{ ...sectionStyle, border: '0.5px solid rgba(255,59,48,0.2)', animation: 'sectionIn 0.4s var(--ease-spring) 0.2s both' }}>
                <div style={{ padding: 16 }}>
                    <p style={{ fontWeight: 800, color: 'var(--red)', margin: '0 0 4px', fontSize: 14 }}>{t.dangerZone}</p>
                    <p style={{ fontSize: 12, color: 'var(--tg-hint)', margin: '0 0 14px', lineHeight: 1.45 }}>{t.dangerZoneDesc}</p>
                    <button onClick={handleDeleteBot} style={{
                        width: '100%', padding: '13px', borderRadius: 14,
                        background: 'rgba(255,59,48,0.09)', color: 'var(--red)',
                        fontSize: 14, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontFamily: 'inherit', transition: 'background 0.15s, transform 0.1s',
                    }}
                        onPointerDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                        onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Trash2 size={16} />
                        {t.deleteBot}
                    </button>
                </div>
            </section>
        </div>
    );
}
