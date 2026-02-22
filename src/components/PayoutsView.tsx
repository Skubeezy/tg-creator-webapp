'use client';

import { Wallet, ArrowDownRight, Clock } from 'lucide-react';
import { TranslationDict } from '@/lib/translations';

export function PayoutsView({ t }: { t: TranslationDict }) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <h1 className="text-2xl font-bold mb-2">{t.payouts}</h1>

            <div className="tg-card shadow-lg flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #e0f2fe)', color: 'var(--tg-theme-button-color, #2563eb)' }}>
                        <Wallet size={24} />
                    </div>
                    <div>
                        <div className="text-sm opacity-60">{t.availablePayout}</div>
                        <div className="text-3xl font-black">$0.00</div>
                    </div>
                </div>

                <button
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)', color: 'var(--tg-theme-button-text-color, #ffffff)' }}
                    disabled
                >
                    <ArrowDownRight size={20} />
                    {t.withdrawFunds}
                </button>
                <p className="text-xs text-center opacity-60">
                    {t.withdrawHint}
                </p>
            </div>

            <h2 className="text-lg font-bold mt-4">{t.operationHistory}</h2>

            <div className="tg-card flex flex-col items-center justify-center py-10 gap-3 text-center opacity-50">
                <Clock size={32} />
                <p>{t.noHistory}</p>
            </div>
        </div>
    );
}
