'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Tag, Trash2, PlusCircle, Check, ChevronDown, MessageSquare, Sparkles } from 'lucide-react';
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

// ─── Duration options ───
const DURATION_OPTIONS = [
    { days: 1, labelRu: '1 день', labelEn: '1 day' },
    { days: 7, labelRu: '1 неделя', labelEn: '1 week' },
    { days: 30, labelRu: '1 месяц', labelEn: '1 month' },
    { days: 90, labelRu: '3 месяца', labelEn: '3 months' },
    { days: 180, labelRu: '6 месяцев', labelEn: '6 months' },
    { days: 365, labelRu: '1 год', labelEn: '1 year' },
];

// ─── Custom Duration Picker (Bottom Sheet) ───
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
            <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'color-mix(in srgb, var(--tg-hint) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--tg-hint) 12%, transparent)',
                    color: 'var(--tg-text)',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'background 0.15s, transform 0.1s',
                }}
                onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <span>{isRu ? selected.labelRu : selected.labelEn}</span>
                <ChevronDown size={16} style={{ color: 'var(--tg-hint)' }} />
            </button>

            {open && typeof document !== 'undefined' && require('react-dom').createPortal(
                <div className="fixed inset-0 z-[99999] flex flex-col justify-end bg-black/40 backdrop-blur-[2px]"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                    onClick={() => setOpen(false)}>
                    <div className="w-full bg-[var(--tg-bg)] rounded-t-[28px] p-5 pb-8 shadow-2xl relative"
                        style={{ animation: 'slideUp 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 rounded-full bg-[var(--tg-separator)] mx-auto mb-5 opacity-70" />
                        <h3 className="text-[19px] font-bold text-center mb-6" style={{ color: 'var(--tg-text)' }}>
                            {isRu ? 'Продолжительность' : 'Duration'}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {DURATION_OPTIONS.map((opt) => {
                                const isSelected = opt.days === value;
                                return (
                                    <button
                                        key={opt.days}
                                        type="button"
                                        onClick={() => { onChange(opt.days); setOpen(false); }}
                                        className="flex items-center justify-between p-4 rounded-[16px] transition-all active:scale-[0.98]"
                                        style={{
                                            background: isSelected ? 'color-mix(in srgb, var(--tg-accent) 12%, transparent)' : 'color-mix(in srgb, var(--tg-hint) 5%, transparent)',
                                            color: isSelected ? 'var(--tg-accent)' : 'var(--tg-text)',
                                            border: isSelected ? '1px solid color-mix(in srgb, var(--tg-accent) 30%, transparent)' : '1px solid transparent'
                                        }}
                                    >
                                        <span className="text-[16px]" style={{ fontWeight: isSelected ? 700 : 500 }}>
                                            {isRu ? opt.labelRu : opt.labelEn}
                                        </span>
                                        {isSelected && <Check size={18} strokeWidth={3} />}
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

// ─── Price Picker (iOS Stars-style slider) ────────────────────────────────────

const PRICE_MIN = 1;
const PRICE_MAX = 200;
const PRICE_STEP = 1;

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

    // Keep draft in sync when value changes externally
    useEffect(() => { setDraft(value); }, [value]);

    const pct = ((draft - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

    return (
        <>
            {/* Inline price display / tap target */}
            <button
                type="button"
                onClick={handleOpen}
                style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '10px 14px', borderRadius: 14, flexShrink: 0,
                    background: 'color-mix(in srgb, var(--tg-accent) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--tg-accent) 20%, transparent)',
                    cursor: 'pointer', transition: 'transform 0.1s',
                    fontFamily: 'inherit',
                }}
                onPointerDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <span style={{ fontWeight: 700, color: 'var(--tg-accent)', fontSize: 15 }}>$</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--tg-text)', minWidth: 28, textAlign: 'right' }}>
                    {value}
                </span>
            </button>

            {/* Bottom Sheet Slider */}
            {open && typeof document !== 'undefined' && require('react-dom').createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex flex-col justify-end"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease-out' }}
                    onClick={handleAccept}
                >
                    <div
                        className="w-full rounded-t-[28px] p-6 pb-10"
                        style={{
                            background: 'var(--tg-bg)',
                            boxShadow: '0 -8px 48px rgba(0,0,0,0.22)',
                            animation: 'slideUp 0.32s cubic-bezier(0.22,0.61,0.36,1)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--tg-separator)', margin: '0 auto 20px', opacity: 0.6 }} />

                        {/* Title */}
                        <p style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--tg-text)', marginBottom: 32 }}>
                            {isRu ? 'Стоимость подписки' : 'Subscription Price'}
                        </p>

                        {/* Large price display */}
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <span style={{
                                fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em',
                                color: 'var(--tg-accent)',
                                display: 'inline-block',
                                transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)',
                                transform: 'scale(1)',
                            }}>
                                ${draft}
                            </span>
                            <span style={{ fontSize: 16, color: 'var(--tg-hint)', display: 'block', marginTop: 2 }}>
                                {isRu ? 'за период' : 'per period'}
                            </span>
                        </div>

                        {/* Slider */}
                        <div style={{ position: 'relative', padding: '12px 0', marginBottom: 8 }}>
                            {/* Track background */}
                            <div style={{
                                height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--tg-hint) 15%, transparent)',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Filled portion */}
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0,
                                    width: `${pct}%`,
                                    background: 'var(--tg-accent)',
                                    borderRadius: 3,
                                    transition: 'width 0.06s ease',
                                }} />
                            </div>
                            <input
                                type="range"
                                min={PRICE_MIN}
                                max={PRICE_MAX}
                                step={PRICE_STEP}
                                value={draft}
                                onChange={e => {
                                    setDraft(Number(e.target.value));
                                    try { WebApp.HapticFeedback.selectionChanged(); } catch (_) { }
                                }}
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer',
                                    margin: 0, padding: 0,
                                }}
                            />
                        </div>

                        {/* Min / Max labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                            <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>${PRICE_MIN}</span>
                            <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>${PRICE_MAX}</span>
                        </div>

                        {/* Done button */}
                        <button className="action-btn" onClick={handleAccept}>
                            {isRu ? 'Готово' : 'Done'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}


export function SettingsView({ API_URL, botId, onBack, onDeleted, t }: { API_URL: string, botId: string, onBack: () => void, onDeleted: () => void, t: TranslationDict }) {
    const isRu = t.isRu;
    const router = require('next/navigation').useRouter();
    const [welcomeText, setWelcomeText] = useState('');
    const [plans, setPlans] = useState<Plan[]>([]);

    const [initialWelcomeText, setInitialWelcomeText] = useState('');
    const [initialPlans, setInitialPlans] = useState<Plan[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    const hasUnsavedPlans = useMemo(() => {
        if (plans.length !== initialPlans.length) return true;
        for (let i = 0; i < plans.length; i++) {
            const p1 = plans[i], p2 = initialPlans[i];
            if (p1.durationDays !== p2.durationDays || p1.price !== p2.price || p1.isNew || p1.isChanged) return true;
        }
        return false;
    }, [plans, initialPlans]);

    const hasUnsavedChanges = welcomeText !== initialWelcomeText || hasUnsavedPlans;

    // ── Bridge to AppShell's SaveFAB via body dataset ──────────────────────
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.dataset.unsaved = hasUnsavedChanges ? 'true' : 'false';
    }, [hasUnsavedChanges]);

    // Clean up flags when view unmounts
    useEffect(() => {
        return () => {
            if (typeof document === 'undefined') return;
            document.body.dataset.unsaved = 'false';
            document.body.dataset.saving = 'false';
            document.body.dataset.savesuccess = 'false';
            delete (window as any).__handleSave;
        };
    }, []);

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
                        id: p.id, durationDays: p.durationDays,
                        price: Number(p.price), currency: 'USD'
                    })).sort((a: Plan, b: Plan) => a.durationDays - b.durationDays);
                    setPlans(rawPlans);
                    setInitialPlans(JSON.parse(JSON.stringify(rawPlans)));

                    const bSettings = bot.settings as any;
                    const wText = bSettings?.welcomeText || bSettings?.welcomeTextEn || bSettings?.welcomeTextRu || (isRu ? 'Добро пожаловать!' : 'Welcome!');

                    setWelcomeText(wText);
                    setInitialWelcomeText(wText);
                }
            }
        } catch (e) { console.error('Failed to load bot data', e); }
    }, [API_URL, botId, isRu]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveAll = useCallback(async () => {
        if (!WebApp.initData) return;
        setIsLoading(true);
        document.body.dataset.saving = 'true';

        try {
            if (welcomeText !== initialWelcomeText) {
                const res = await fetch(`${API_URL}/me/config`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                    body: JSON.stringify({ welcomeText })
                });
                if (res.ok) {
                    setInitialWelcomeText(welcomeText);
                } else {
                    const errText = await res.text().catch(() => '');
                    console.error('[SettingsView] PATCH /me/config failed:', res.status, errText);
                    throw new Error(`Save failed: ${res.status}`);
                }
            }

            let newPlansState = [...plans];
            for (let i = 0; i < plans.length; i++) {
                const plan = plans[i];
                if (plan.isNew) {
                    const res = await fetch(`${API_URL}/me/bots/${botId}/plans`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                        body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price, currency: plan.currency || 'USD' })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        newPlansState[i] = { ...data.plan, price: Number(data.plan.price), isNew: false, isChanged: false };
                    }
                } else if (plan.id && plan.isChanged) {
                    const res = await fetch(`${API_URL}/me/plans/${plan.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                        body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price, currency: plan.currency || 'USD' })
                    });
                    if (res.ok) { newPlansState[i].isChanged = false; }
                }
            }
            setPlans(newPlansState);
            setInitialPlans(JSON.parse(JSON.stringify(newPlansState)));

            document.body.dataset.saving = 'false';
            document.body.dataset.savesuccess = 'true';
            setTimeout(() => { document.body.dataset.savesuccess = 'false'; }, 1700);
            setTimeout(() => router.refresh(), 500);
        } catch (e) {
            console.error('[SettingsView] handleSaveAll error:', e);
            document.body.dataset.saving = 'false';
            document.body.dataset.savesuccess = 'false';
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, botId, welcomeText, initialWelcomeText, plans, router]);

    // Register save handler for FAB in AppShell
    useEffect(() => {
        (window as any).__handleSave = handleSaveAll;
    }, [handleSaveAll]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        WebApp.MainButton.hide();
    }, []);

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
                            setPlans(plans.filter((_, i) => i !== index));
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
        WebApp.showConfirm(
            t.deleteBotConfirm,
            async (confirm) => {
                if (confirm && WebApp.initData) {
                    try {
                        const res = await fetch(`${API_URL}/me/bots/${botId}`, {
                            method: 'DELETE', headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                        });
                        if (res.ok) {
                            onDeleted();
                            router.refresh();
                        } else WebApp.showAlert(isRu ? 'Ошибка удаления бота' : 'Error deleting bot');
                    } catch { WebApp.showAlert(isRu ? 'Ошибка сети' : 'Network error'); }
                }
            }
        );
    };

    const S = {
        section: {
            borderRadius: 20,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid var(--glass-border)',
            position: 'relative' as const,
        } as React.CSSProperties,
        header: {
            padding: '14px 16px', borderBottom: '0.5px solid color-mix(in srgb, var(--tg-hint) 10%, transparent)',
            display: 'flex', alignItems: 'center', gap: 10,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
        } as React.CSSProperties,
        iconBox: (color: string, bg: string) => ({
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: bg, color,
        }) as React.CSSProperties,
        body: { padding: '14px 16px' } as React.CSSProperties,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', paddingBottom: 96 }}>

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={onBack} style={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'color-mix(in srgb, var(--tg-hint) 10%, transparent)', border: 'none', cursor: 'pointer',
                        color: 'var(--tg-accent)',
                    }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                        {t.botSettings}
                    </h1>
                </div>
            </header>

            {/* Welcome Message */}
            <section style={S.section}>
                <div style={S.header}>
                    <div style={S.iconBox('var(--tg-accent)', 'color-mix(in srgb, var(--tg-accent) 10%, transparent)')}>
                        <MessageSquare size={16} strokeWidth={2} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{t.welcomeMessage}</span>
                </div>
                <div style={S.body}>
                    <textarea
                        style={{
                            width: '100%', minHeight: 90, padding: 12, borderRadius: 14,
                            background: 'color-mix(in srgb, var(--tg-hint) 7%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--tg-hint) 12%, transparent)',
                            color: 'var(--tg-text)', fontSize: 14, lineHeight: 1.5,
                            resize: 'none', outline: 'none', fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s',
                        }}
                        value={welcomeText}
                        onChange={e => setWelcomeText(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = 'var(--tg-accent)'; }}
                        onBlur={e => {
                            e.target.style.borderColor = 'color-mix(in srgb, var(--tg-hint) 12%, transparent)';
                            window.scrollTo(0, 0);
                        }}
                    />
                    <p style={{ fontSize: 11, color: 'var(--tg-hint)', marginTop: 8, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8 }}>
                        <Sparkles size={12} />
                        {t.autoTranslateHint}
                    </p>
                </div>
            </section>

            {/* Subscription Plans */}
            <section style={{ ...S.section, zIndex: 10 }}>
                <div style={S.header}>
                    <div style={S.iconBox('#34c759', 'rgba(52,199,89,0.12)')}>
                        <Tag size={16} strokeWidth={2} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{t.subscriptionPlansSection}</span>
                </div>
                <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plans.map((plan, i) => (
                        <div key={plan.id || i} style={{
                            padding: '12px 14px', borderRadius: 16,
                            background: 'color-mix(in srgb, var(--tg-hint) 6%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--tg-hint) 10%, transparent)',
                            display: 'flex', flexDirection: 'column', gap: 10,
                            animation: 'listItemIn 0.35s var(--ease-spring) both',
                            animationDelay: `${i * 0.05}s`,
                        }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                {/* Duration picker */}
                                <DurationPicker
                                    value={plan.durationDays}
                                    isRu={isRu}
                                    onChange={days => {
                                        const newPlans = [...plans];
                                        newPlans[i] = { ...newPlans[i], durationDays: days, isChanged: true };
                                        setPlans(newPlans);
                                    }}
                                />

                                {/* Price Picker — iOS Stars-style slider */}
                                <PricePicker
                                    value={plan.price}
                                    isRu={isRu}
                                    onChange={price => {
                                        const newPlans = [...plans];
                                        newPlans[i] = { ...newPlans[i], price, isChanged: true };
                                        setPlans(newPlans);
                                    }}
                                />

                                {/* Delete */}
                                <button onClick={() => handleDeletePlan(i)} style={{
                                    width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer',
                                    background: 'rgba(255,59,48,0.1)', color: '#ff3b30', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'transform 0.1s, background 0.15s',
                                }}
                                    onPointerDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                    onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Trash2 size={16} strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button onClick={() => setPlans([...plans, { durationDays: 30, price: 10, currency: 'USD', isNew: true }])}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '13px', borderRadius: 16, border: '1.5px dashed color-mix(in srgb, var(--tg-hint) 25%, transparent)',
                            background: 'transparent', color: 'var(--tg-accent)', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                        }}>
                        <PlusCircle size={17} />
                        {t.addPlan}
                    </button>
                </div>
            </section>

            {/* Danger Zone */}
            <section style={{ ...S.section, border: '0.5px solid rgba(255,59,48,0.25)' }}>
                <div style={{ padding: '16px' }}>
                    <p style={{ fontWeight: 700, color: '#ff3b30', marginTop: 0, marginBottom: 6 }}>
                        {t.dangerZone}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 0, marginBottom: 14 }}>
                        {t.dangerZoneDesc}
                    </p>
                    <button onClick={handleDeleteBot} style={{
                        width: '100%', padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: 'rgba(255,59,48,0.1)', color: '#ff3b30',
                        fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
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
