'use client';

import { Zap, Clock, CheckCircle2, AlertCircle, Send, Link, TrendingUp, Sparkles } from 'lucide-react';
import { TranslationDict } from '@/lib/translations';
import { useState, useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';

// ─── Animated Number Counter ─────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '$', decimals = 2 }: { value: number; prefix?: string; decimals?: number }) {
    const [displayed, setDisplayed] = useState(0);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number>(0);
    const duration = 1200;

    useEffect(() => {
        startRef.current = null;
        const from = 0;
        const to = value;
        const step = (ts: number) => {
            if (startRef.current === null) startRef.current = ts;
            const elapsed = ts - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(from + (to - from) * eased);
            if (progress < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [value]);

    return (
        <span>
            {prefix}{displayed.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        </span>
    );
}

// ─── Pulsing Status Dot ───────────────────────────────────────────────────────
function StatusDot({ active }: { active: boolean }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10 }}>
            {active && (
                <span style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: '#34c759',
                    opacity: 0.5,
                    animation: 'pulseRing 1.8s ease-out infinite',
                }} />
            )}
            <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: active ? '#34c759' : 'var(--tg-hint)',
                flexShrink: 0,
            }} />
        </span>
    );
}

// ─── CryptoBot Logo SVG ───────────────────────────────────────────────────────
function CryptoBotIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="8" fill="#2AABEE" />
            <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.5 10.5h-7c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h7c.28 0 .5.22.5.5s-.22.5-.5.5zm0-3h-7c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h7c.28 0 .5.22.5.5s-.22.5-.5.5zm0-3h-7c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h7c.28 0 .5.22.5.5s-.22.5-.5.5z" fill="white" />
        </svg>
    );
}

// ─── Transaction Row Component ────────────────────────────────────────────────
function TxRow({ tx, idx, isRu }: { tx: any; idx: number; isRu: boolean }) {
    const isComplete = tx.status === 'COMPLETED';
    const isStars = tx.currency === 'Stars';
    const amount = Number(tx.amount);

    return (
        <div
            className="list-item-enter"
            style={{
                animationDelay: `${idx * 60}ms`,
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                gap: 12,
            }}
        >
            {/* Icon */}
            <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: isComplete ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)',
                color: isComplete ? '#34c759' : '#ff9500',
            }}>
                {isComplete ? <CheckCircle2 size={20} strokeWidth={2} /> : <Clock size={20} strokeWidth={2} />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: '1.2' }}>
                    {tx.destination || (isRu ? 'Авто-выплата' : 'Auto Payout')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 2 }}>
                    {new Date(tx.createdAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                </div>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: isComplete ? '#34c759' : 'var(--tg-text)' }}>
                    +{isStars ? '⭐' : '$'}{amount.toFixed(2)}
                </div>
                <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: isComplete ? '#34c759' : '#ff9500',
                    marginTop: 2,
                }}>
                    {isComplete ? (isRu ? 'Выплачено' : 'Paid') : (isRu ? 'В очереди' : 'Pending')}
                </div>
            </div>
        </div>
    );
}

// ─── Main PayoutsView ─────────────────────────────────────────────────────────
export function PayoutsView({ API_URL, t }: { API_URL: string; t: TranslationDict }) {
    const [walletAddress, setWalletAddress] = useState('');
    const [inputWallet, setInputWallet] = useState('');
    const [lifetimeRevenue, setLifetimeRevenue] = useState(0);
    const [pendingPayout, setPendingPayout] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const isRu = t.isRu;
    const hasWallet = !!walletAddress;

    const fetchData = async () => {
        try {
            if (typeof window === 'undefined' || !WebApp.initData) return;
            const res = await fetch(`${API_URL.replace('/bots', '')}/me/wallet`, {
                headers: { 'Authorization': `Bearer ${WebApp.initData}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWalletAddress(data.walletAddress || '');
                setInputWallet(data.walletAddress || '');
                setLifetimeRevenue(data.lifetimeRevenue || 0);
                setPendingPayout(data.pendingPayout || 0);
                setHistory(data.history || []);
            }
        } catch (e) {
            console.error('[PayoutsView] Failed to fetch wallet', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [API_URL]);

    const handleSave = async () => {
        const cleaned = inputWallet.trim().replace(/^@/, '');
        if (!cleaned || cleaned.length < 3) {
            WebApp.showAlert(isRu ? 'Введите корректный @username' : 'Enter a valid @username');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL.replace('/bots', '')}/me/wallet`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${WebApp.initData}`
                },
                body: JSON.stringify({ walletAddress: cleaned })
            });
            const data = await res.json();
            if (data.success) {
                setWalletAddress(cleaned);
                setIsEditing(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
            } else {
                WebApp.showAlert(t.networkError);
            }
        } catch (e) {
            WebApp.showAlert(t.networkError);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="tg-card" style={{ height: 160, opacity: 0.4 }} />
                <div className="tg-card" style={{ height: 120, opacity: 0.3 }} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── Page Title ── */}
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
                {t.payouts}
            </h1>

            {/* ── Hero Balance Card (water-fill) ── */}
            <div className="water-card">
                <div
                    className="water-fill"
                    style={{ height: `${Math.min(100, (lifetimeRevenue / Math.max(lifetimeRevenue, 1000)) * 100)}%` }}
                />
                <div className="water-content" style={{ padding: 20 }}>
                    {/* Revenue + pending row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tg-hint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                {t.totalEarned}
                            </div>
                            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                <AnimatedNumber value={lifetimeRevenue} />
                            </div>
                        </div>

                        {/* Auto-payout status badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 20,
                            background: hasWallet ? 'rgba(52, 199, 89, 0.12)' : 'rgba(120,120,128,0.1)',
                            border: `0.5px solid ${hasWallet ? 'rgba(52,199,89,0.3)' : 'rgba(120,120,128,0.2)'}`,
                        }}>
                            <StatusDot active={hasWallet} />
                            <span style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: hasWallet ? '#34c759' : 'var(--tg-hint)',
                            }}>
                                {hasWallet ? (isRu ? 'Авто' : 'Auto') : (isRu ? 'Откл.' : 'Off')}
                            </span>
                        </div>
                    </div>

                    {/* Stat row */}
                    <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--tg-hint)', fontWeight: 500, marginBottom: 2 }}>
                                {t.pendingPayout}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
                                ${pendingPayout.toFixed(2)}
                            </div>
                        </div>
                        <div style={{ width: 1, background: 'var(--tg-separator)' }} />
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--tg-hint)', fontWeight: 500, marginBottom: 2 }}>
                                {isRu ? 'Транзакций' : 'Transactions'}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
                                {history.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Wallet Connection Card ── */}
            <div className="tg-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header section */}
                <div style={{ padding: '16px 16px 14px', borderBottom: '0.5px solid var(--tg-separator)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(42, 171, 238, 0.12)',
                            flexShrink: 0,
                        }}>
                            <CryptoBotIcon size={28} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: '1.2' }}>
                                {hasWallet ? t.walletConnected : t.connectWallet}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--tg-hint)', marginTop: 2 }}>
                                @CryptoBot
                            </div>
                        </div>
                        {hasWallet && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    background: 'color-mix(in srgb, var(--tg-accent) 10%, transparent)',
                                    color: 'var(--tg-accent)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                {isRu ? 'Изменить' : 'Edit'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Wallet display / input section */}
                {hasWallet && !isEditing ? (
                    <div style={{ padding: '14px 16px' }}>
                        {/* Connected info row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: 'rgba(52, 199, 89, 0.07)',
                            border: '0.5px solid rgba(52, 199, 89, 0.2)',
                        }}>
                            <Zap size={16} color="#34c759" strokeWidth={2.5} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#34c759' }}>
                                    {t.instantPayouts}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--tg-hint)', marginTop: 1 }}>
                                    @{walletAddress}
                                </div>
                            </div>
                            <CheckCircle2 size={18} color="#34c759" strokeWidth={2} />
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Input */}
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--tg-hint)', fontSize: 15, fontWeight: 500, pointerEvents: 'none',
                            }}>
                                @
                            </span>
                            <input
                                type="text"
                                className="tg-input"
                                placeholder={isRu ? 'ваш_username' : 'your_username'}
                                value={inputWallet.replace(/^@/, '')}
                                onChange={e => setInputWallet(e.target.value.replace(/^@/, ''))}
                                style={{ paddingLeft: 28 }}
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--tg-hint)', margin: 0, paddingLeft: 2 }}>
                            {t.walletUsernameHint}
                        </p>

                        {/* Save button */}
                        <button
                            className="action-btn"
                            onClick={handleSave}
                            disabled={isSaving || !inputWallet.trim()}
                            style={{ marginTop: 4 }}
                        >
                            {isSaving ? (
                                <span style={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    border: '2.5px solid rgba(255,255,255,0.4)',
                                    borderTopColor: 'white',
                                    animation: 'spin 0.7s linear infinite',
                                    display: 'inline-block',
                                }} />
                            ) : saveSuccess ? (
                                <>
                                    <CheckCircle2 size={18} strokeWidth={2.5} />
                                    {t.walletSaved}
                                </>
                            ) : (
                                <>
                                    <Link size={18} strokeWidth={2} />
                                    {t.saveWallet}
                                </>
                            )}
                        </button>

                        {isEditing && (
                            <button
                                onClick={() => { setIsEditing(false); setInputWallet(walletAddress); }}
                                style={{
                                    fontSize: 14, fontWeight: 600, color: 'var(--tg-hint)',
                                    textAlign: 'center', padding: '6px', background: 'none', border: 'none', cursor: 'pointer',
                                }}
                            >
                                {t.cancel}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── How it works (only when no wallet) ── */}
            {!hasWallet && (
                <div
                    className="tg-card"
                    style={{
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        background: 'rgba(42, 171, 238, 0.05)',
                        border: '0.5px solid rgba(42,171,238,0.15)',
                        padding: 16,
                    }}
                >
                    <Sparkles size={20} style={{ color: 'var(--tg-accent)', flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
                    <p style={{ fontSize: 13, color: 'var(--tg-text)', margin: 0, lineHeight: '1.5', opacity: 0.85 }}>
                        {t.noWalletHint}
                    </p>
                </div>
            )}

            {/* ── Auto-payout status card (only when wallet is connected) ── */}
            {hasWallet && (
                <div
                    className="tg-card stat-card-anim visible"
                    style={{
                        display: 'flex', flexDirection: 'column', gap: 10,
                        background: 'linear-gradient(135deg, rgba(52,199,89,0.04) 0%, transparent 100%)',
                        border: '0.5px solid rgba(52,199,89,0.15)',
                        padding: 16,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'rgba(52,199,89,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <TrendingUp size={18} color="#34c759" strokeWidth={2} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{t.autoPayouts}</div>
                            <div style={{ fontSize: 12, color: '#34c759', fontWeight: 600, marginTop: 1 }}>
                                {t.autoPayoutsOn}
                            </div>
                        </div>
                    </div>

                    {/* Flow visualization */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(0,0,0,0.03)',
                        fontSize: 12, fontWeight: 500, color: 'var(--tg-hint)',
                    }}>
                        <span>🧑 {isRu ? 'Фан платит' : 'Fan pays'}</span>
                        <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--tg-accent), #34c759)', borderRadius: 1, margin: '0 4px' }} />
                        <Zap size={12} color="#34c759" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#34c759', flexShrink: 0 }}>{isRu ? 'Мгновенно → @' : 'Instant → @'}{walletAddress}</span>
                    </div>
                </div>
            )}

            {/* ── Transaction History ── */}
            <p className="section-header">{t.operationHistory}</p>

            {history.length === 0 ? (
                <div className="tg-card" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '40px 20px', gap: 10,
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'color-mix(in srgb, var(--tg-hint) 8%, transparent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Send size={24} style={{ color: 'var(--tg-hint)', opacity: 0.5 }} strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--tg-text)', opacity: 0.6 }}>
                        {t.noHistory}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--tg-hint)', margin: 0, textAlign: 'center', maxWidth: 220 }}>
                        {isRu ? 'Транзакции появятся после первой продажи подписки' : 'Transactions will appear after your first subscription sale'}
                    </p>
                </div>
            ) : (
                <div className="tg-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {history.map((tx, idx) => (
                        <div key={tx.id}>
                            <TxRow tx={tx} idx={idx} isRu={isRu} />
                            {idx < history.length - 1 && <div className="list-separator" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
