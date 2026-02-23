'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Tag, Trash2, PlusCircle, Save, Loader2, Wallet, Check, ChevronDown, MessageSquare } from 'lucide-react';
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

// ─── Toast ───
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('hold'), 350);
        const t2 = setTimeout(() => setPhase('out'), 2400);
        const t3 = setTimeout(() => onDone(), 2900);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onDone]);

    const translateY = phase === 'in' ? 'translateY(80px)' : phase === 'out' ? 'translateY(80px)' : 'translateY(0px)';
    const opacity = phase === 'hold' ? 1 : 0;

    return (
        <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: `translateX(-50%) ${translateY}`,
            opacity,
            transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
            zIndex: 999,
            pointerEvents: 'none',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                borderRadius: '20px',
                background: 'var(--tg-text)',
                color: 'var(--tg-bg, #fff)',
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
                <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--tg-theme-button-color, #3390ec)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Check size={12} color="white" strokeWidth={3} />
                </div>
                {message}
            </div>
        </div>
    );
}

// ─── Custom Duration Picker ───
function DurationPicker({ value, onChange, isRu }: { value: number; onChange: (days: number) => void; isRu: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = DURATION_OPTIONS.find(o => o.days === value) || DURATION_OPTIONS[2];

    useEffect(() => {
        if (!open) return;
        const handler = (e: TouchEvent | MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('touchstart', handler);
        document.addEventListener('mousedown', handler);
        return () => { document.removeEventListener('touchstart', handler); document.removeEventListener('mousedown', handler); };
    }, [open]);

    return (
        <div ref={ref} style={{ position: 'relative', flex: 1 }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
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
                    transition: 'background 0.15s',
                }}
            >
                <span>{isRu ? selected.labelRu : selected.labelEn}</span>
                <ChevronDown size={16} style={{
                    color: 'var(--tg-hint)',
                    transform: open ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)'
                }} />
            </button>

            {/* Dropdown */}
            <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 100,
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--tg-bg, #fff)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06)',
                transformOrigin: 'top center',
                transform: open ? 'scaleY(1) translateY(0)' : 'scaleY(0.8) translateY(-8px)',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'all' : 'none',
                transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
            }}>
                {DURATION_OPTIONS.map((opt, idx) => (
                    <div key={opt.days}>
                        <button
                            type="button"
                            onClick={() => { onChange(opt.days); setOpen(false); }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '13px 16px',
                                background: opt.days === value ? 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 8%, transparent)' : 'transparent',
                                color: opt.days === value ? 'var(--tg-theme-button-color, #3390ec)' : 'var(--tg-text)',
                                fontSize: 15,
                                fontWeight: opt.days === value ? 600 : 400,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                textAlign: 'left',
                                border: 'none',
                                outline: 'none',
                                transition: 'background 0.12s',
                            }}
                        >
                            {isRu ? opt.labelRu : opt.labelEn}
                            {opt.days === value && <Check size={16} style={{ color: 'var(--tg-theme-button-color, #3390ec)' }} strokeWidth={2.5} />}
                        </button>
                        {idx < DURATION_OPTIONS.length - 1 && (
                            <div style={{ height: '0.5px', background: 'color-mix(in srgb, var(--tg-hint) 10%, transparent)', marginLeft: 16 }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


export function SettingsView({ API_URL, botId, onBack, onDeleted, t }: { API_URL: string, botId: string, onBack: () => void, onDeleted: () => void, t: TranslationDict }) {
    const isRu = t.isRu;
    const [welcomeText, setWelcomeText] = useState('');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [paymentMethods, setPaymentMethods] = useState({ stars: true, crypto: true, card: true });

    const [initialWelcomeText, setInitialWelcomeText] = useState('');
    const [initialPlans, setInitialPlans] = useState<Plan[]>([]);
    const [initialPaymentMethods, setInitialPaymentMethods] = useState({ stars: true, crypto: true, card: true });

    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const hasUnsavedPlans = useMemo(() => {
        if (plans.length !== initialPlans.length) return true;
        for (let i = 0; i < plans.length; i++) {
            const p1 = plans[i], p2 = initialPlans[i];
            if (p1.durationDays !== p2.durationDays || p1.price !== p2.price || p1.isNew || p1.isChanged) return true;
        }
        return false;
    }, [plans, initialPlans]);

    const hasUnsavedPaymentMethods =
        paymentMethods.stars !== initialPaymentMethods.stars ||
        paymentMethods.crypto !== initialPaymentMethods.crypto ||
        paymentMethods.card !== initialPaymentMethods.card;

    const hasUnsavedChanges = welcomeText !== initialWelcomeText || hasUnsavedPlans || hasUnsavedPaymentMethods;

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
                    const wText = bSettings?.welcomeText || 'Welcome!';
                    setWelcomeText(wText);
                    setInitialWelcomeText(wText);

                    const pMethods = bSettings?.paymentMethods || { stars: true, crypto: true, card: true };
                    setPaymentMethods(pMethods);
                    setInitialPaymentMethods({ ...pMethods });
                }
            }
        } catch (e) { console.error('Failed to load bot data', e); }
    }, [API_URL, botId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveAll = useCallback(async () => {
        if (!WebApp.initData) return;
        setIsLoading(true);

        try {
            if (welcomeText !== initialWelcomeText || hasUnsavedPaymentMethods) {
                const res = await fetch(`${API_URL}/me/config`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WebApp.initData}` },
                    body: JSON.stringify({ welcomeText, paymentMethods })
                });
                if (res.ok) {
                    setInitialWelcomeText(welcomeText);
                    setInitialPaymentMethods({ ...paymentMethods });
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

            // Show animated toast instead of WebApp.showAlert
            setToast(t.settingsSaved);
        } catch {
            setToast(t.settingsSaveError);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, botId, welcomeText, initialWelcomeText, hasUnsavedPaymentMethods, paymentMethods, initialPaymentMethods, plans, isRu]);

    // Wire Telegram native MainButton is removed per user request
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
                        if (res.ok) setPlans(plans.filter((_, i) => i !== index));
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
                        if (res.ok) onDeleted();
                        else WebApp.showAlert(isRu ? 'Ошибка удаления бота' : 'Error deleting bot');
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', paddingBottom: 24 }}>
            {/* Toast */}
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    <p style={{ fontSize: 12, color: 'var(--tg-hint)', marginBottom: 10, marginTop: 0 }}>
                        {t.welcomeHint}
                    </p>
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
                        onFocus={e => (e.target.style.borderColor = 'var(--tg-accent)')}
                        onBlur={e => (e.target.style.borderColor = 'color-mix(in srgb, var(--tg-hint) 12%, transparent)')}
                    />
                </div>
            </section>

            {/* Payment Methods */}
            <section style={S.section}>
                <div style={S.header}>
                    <div style={S.iconBox('#ff9500', 'rgba(255,149,0,0.12)')}>
                        <Wallet size={16} strokeWidth={2} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{t.paymentMethods}</span>
                </div>
                <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {([
                        { key: 'stars', label: 'Telegram Stars' },
                        { key: 'crypto', label: isRu ? 'Крипто (CryptoPay)' : 'Crypto (CryptoPay)' },
                        { key: 'card', label: isRu ? 'Банковская карта' : 'Bank Card (Stripe)' },
                    ] as { key: 'stars' | 'crypto' | 'card'; label: string }[]).map(method => {
                        const isChecked = paymentMethods[method.key];
                        return (
                            <label key={method.key} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '11px 12px', borderRadius: 12, cursor: 'pointer',
                                background: isChecked ? 'color-mix(in srgb, var(--tg-accent) 6%, transparent)' : 'transparent',
                                transition: 'background 0.2s',
                            }}>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{method.label}</span>
                                <div style={{
                                    width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
                                    background: isChecked ? 'var(--tg-accent)' : 'color-mix(in srgb, var(--tg-hint) 25%, transparent)',
                                    position: 'relative', transition: 'background 0.25s cubic-bezier(0.4,0,0.2,1)',
                                    flexShrink: 0,
                                }} onClick={() => {
                                    const newMethods = { ...paymentMethods, [method.key]: !isChecked };
                                    if (!newMethods.stars && !newMethods.crypto && !newMethods.card) return;
                                    setPaymentMethods(newMethods);
                                }}>
                                    <div style={{
                                        position: 'absolute', top: 3, left: isChecked ? 21 : 3,
                                        width: 20, height: 20, borderRadius: '50%', background: 'white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
                                    }} />
                                </div>
                            </label>
                        );
                    })}
                </div>
            </section>

            {/* Subscription Plans */}
            <section style={S.section}>
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
                        }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                {/* Custom Duration Picker */}
                                <DurationPicker
                                    value={plan.durationDays}
                                    isRu={isRu}
                                    onChange={days => {
                                        const newPlans = [...plans];
                                        newPlans[i] = { ...newPlans[i], durationDays: days, isChanged: true };
                                        setPlans(newPlans);
                                    }}
                                />

                                {/* Price input */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '10px 14px', borderRadius: 14, flexShrink: 0,
                                    background: 'color-mix(in srgb, var(--tg-hint) 8%, transparent)',
                                    border: '1px solid color-mix(in srgb, var(--tg-hint) 12%, transparent)',
                                }}>
                                    <span style={{ fontWeight: 700, color: 'var(--tg-accent)', fontSize: 15 }}>$</span>
                                    <input
                                        type="number"
                                        value={plan.price}
                                        onChange={e => {
                                            const newPlans = [...plans];
                                            newPlans[i] = { ...newPlans[i], price: Number(e.target.value), isChanged: true };
                                            setPlans(newPlans);
                                        }}
                                        style={{
                                            width: 52, background: 'transparent', border: 'none', outline: 'none',
                                            fontWeight: 700, fontSize: 15, color: 'var(--tg-text)', textAlign: 'right',
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                </div>

                                <button onClick={() => handleDeletePlan(i)} style={{
                                    width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer',
                                    background: 'rgba(255,59,48,0.1)', color: '#ff3b30', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
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

            {/* Save Button */}
            <button
                onClick={handleSaveAll}
                disabled={isLoading || !hasUnsavedChanges}
                className={hasUnsavedChanges && !isLoading ? "action-btn" : ""}
                style={{
                    width: '100%', padding: '15px', borderRadius: 18, border: 'none', cursor: 'pointer',
                    background: hasUnsavedChanges ? 'var(--tg-accent)' : 'color-mix(in srgb, var(--tg-hint) 15%, transparent)',
                    color: hasUnsavedChanges ? 'white' : 'var(--tg-hint)',
                    fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit',
                    transition: 'background 0.3s, color 0.3s, transform 0.1s',
                    transform: isLoading ? 'scale(0.97)' : 'scale(1)',
                }}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t.saveSettings}
            </button>

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
                        fontFamily: 'inherit',
                    }}>
                        <Trash2 size={16} />
                        {t.deleteBot}
                    </button>
                </div>
            </section>
        </div>
    );
}
