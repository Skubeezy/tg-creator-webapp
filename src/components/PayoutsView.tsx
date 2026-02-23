'use client';

import { Wallet, ArrowDownRight, Clock, Send, ChevronRight, CheckCircle2, RotateCw } from 'lucide-react';
import { TranslationDict } from '@/lib/translations';
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

export function PayoutsView({ API_URL, t }: { API_URL: string, t: TranslationDict }) {
    const [history, setHistory] = useState<any[]>([]);
    const [available, setAvailable] = useState(0);
    const [isRequesting, setIsRequesting] = useState(false);
    const [destination, setDestination] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isRu = t.isRu;

    const fetchPayouts = async () => {
        try {
            if (typeof window !== 'undefined' && WebApp.initData) {
                // Fetch stats for balance limit
                const statsRes = await fetch(`${API_URL}/me/stats`, {
                    headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                });
                let lifetimeRev = 0;
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    lifetimeRev = statsData.lifetimeRevenue;
                }

                const res = await fetch(`${API_URL}/payouts`, {
                    headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.history || []);

                    // Bruteforce calculate remaining available from lifetime minus already requested
                    const requestedSum = (data.history || []).reduce((acc: number, req: any) => acc + Number(req.amount), 0);
                    setAvailable(Math.max(0, lifetimeRev - requestedSum));
                }
            }
        } catch (e) {
            console.error("Failed to fetch payouts", e);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [API_URL]);

    const handleRequest = async () => {
        const numAmount = Number(amount);
        if (numAmount <= 0 || numAmount > available) {
            WebApp.showAlert(t.invalidAmount);
            return;
        }
        if (!destination.trim()) {
            WebApp.showAlert(t.enterAddress);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/payouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${WebApp.initData}`
                },
                body: JSON.stringify({ amount: numAmount, destination, currency: 'USD' })
            });
            const data = await res.json();
            if (data.success) {
                WebApp.showAlert(t.payoutRequested);
                setIsRequesting(false);
                setAmount('');
                setDestination('');
                fetchPayouts();
            } else {
                WebApp.showAlert(t.networkError + ': ' + data.error);
            }
        } catch (e) {
            WebApp.showAlert(t.networkError);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <h1 className="text-[22px] font-bold px-1" style={{ letterSpacing: '-0.02em' }}>{t.payouts}</h1>

            {/* Balance card */}
            <div className="tg-card flex flex-col gap-4 relative overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                        style={{ background: 'rgba(51, 144, 236, 0.1)', color: 'var(--tg-accent)' }}>
                        <Wallet size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>{t.availablePayout}</div>
                        <div className="text-[28px] font-bold" style={{ letterSpacing: '-0.03em' }}>${available.toLocaleString()}</div>
                    </div>
                </div>

                {!isRequesting ? (
                    <>
                        <button
                            className="action-btn"
                            disabled={available <= 0}
                            onClick={() => setIsRequesting(true)}
                        >
                            <ArrowDownRight size={18} />
                            {t.withdrawFunds}
                        </button>
                        <p className="text-[12px] text-center" style={{ color: 'var(--tg-hint)' }}>
                            {t.withdrawHint}
                        </p>
                    </>
                ) : (
                    <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-2 w-full">
                            <input
                                type="number"
                                placeholder={t.amountPlaceholder}
                                className="settings-input flex-1 !mb-0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder={t.destinationPlaceholder}
                            className="settings-input !mb-0"
                            value={destination}
                            onChange={e => setDestination(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                className="flex-1 py-2.5 rounded-[10px] text-[14px] font-medium"
                                style={{ background: 'var(--tg-secondary-bg)', color: 'var(--tg-text)' }}
                                onClick={() => setIsRequesting(false)}
                            >
                                {t.cancel}
                            </button>
                            <button
                                className="flex-1 flex items-center justify-center py-2.5 rounded-[10px] text-[14px] font-medium text-white transition-opacity disabled:opacity-50"
                                style={{ background: 'var(--tg-accent)' }}
                                onClick={handleRequest}
                                disabled={isLoading || !amount || !destination}
                            >
                                {isLoading ? <RotateCw size={16} className="animate-spin" /> : (isRu ? 'Подтвердить' : 'Confirm')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <p className="section-header mt-2">{t.operationHistory}</p>

            {history.length === 0 ? (
                <div className="tg-card flex flex-col items-center justify-center py-12 gap-2.5">
                    <Clock size={28} style={{ color: 'var(--tg-hint)', opacity: 0.4 }} />
                    <p className="text-[14px]" style={{ color: 'var(--tg-hint)' }}>{t.noHistory}</p>
                </div>
            ) : (
                <div className="tg-card !p-0 overflow-hidden">
                    {history.map((req, idx) => (
                        <div key={req.id}>
                            <div className="list-row flex justify-between items-center py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-opacity-20"
                                        style={{
                                            background: req.status === 'COMPLETED' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                                            color: req.status === 'COMPLETED' ? '#34c759' : '#ff9500'
                                        }}>
                                        {req.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[15px] font-medium">{t.withdrawal} {req.currency}</span>
                                        <span className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[15px] font-bold block">-${Number(req.amount).toLocaleString()}</span>
                                    <span className="text-[11px] uppercase font-bold tracking-wider"
                                        style={{ color: req.status === 'COMPLETED' ? '#34c759' : '#ff9500' }}>
                                        {req.status === 'COMPLETED' ? (isRu ? 'Выполнено' : 'Done') : (isRu ? 'В обработке' : 'Pending')}
                                    </span>
                                </div>
                            </div>
                            {idx < history.length - 1 && <div className="list-separator" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
