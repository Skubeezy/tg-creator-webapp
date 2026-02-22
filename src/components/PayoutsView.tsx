'use client';

import { Wallet, ArrowDownRight, Clock } from 'lucide-react';
import { TranslationDict } from '@/lib/translations';

export function PayoutsView({ t }: { t: TranslationDict }) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <h1 className="text-[22px] font-bold px-1" style={{ letterSpacing: '-0.02em' }}>{t.payouts}</h1>

            {/* Balance card */}
            <div className="tg-card flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                        style={{ background: 'rgba(51, 144, 236, 0.1)', color: 'var(--tg-accent)' }}>
                        <Wallet size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>{t.availablePayout}</div>
                        <div className="text-[28px] font-bold" style={{ letterSpacing: '-0.03em' }}>$0.00</div>
                    </div>
                </div>

                <button className="action-btn" disabled>
                    <ArrowDownRight size={18} />
                    {t.withdrawFunds}
                </button>
                <p className="text-[12px] text-center" style={{ color: 'var(--tg-hint)' }}>
                    {t.withdrawHint}
                </p>
            </div>

            <p className="section-header mt-2">{t.operationHistory}</p>

            <div className="tg-card flex flex-col items-center justify-center py-12 gap-2.5">
                <Clock size={28} style={{ color: 'var(--tg-hint)', opacity: 0.4 }} />
                <p className="text-[14px]" style={{ color: 'var(--tg-hint)' }}>{t.noHistory}</p>
            </div>
        </div>
    );
}
