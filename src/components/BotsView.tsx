'use client';

import { useState } from 'react';
import { Plus, ChevronRight, Bot } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { TranslationDict } from '@/lib/translations';

export function BotsView({ API_URL, t }: { API_URL: string, t: TranslationDict }) {
    const [selectedBot, setSelectedBot] = useState<boolean>(false);

    if (selectedBot) {
        return <SettingsView API_URL={API_URL} onBack={() => setSelectedBot(false)} t={t} />;
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <h1 className="text-[22px] font-bold px-1" style={{ letterSpacing: '-0.02em' }}>{t.myBots}</h1>

            {/* iOS grouped list */}
            <div className="tg-card !p-0 overflow-hidden">
                {/* Create Bot */}
                <button
                    className="list-row w-full gap-3"
                    style={{ color: 'var(--tg-accent)' }}
                    onClick={() => setSelectedBot(true)}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(51, 144, 236, 0.1)' }}>
                        <Plus size={22} strokeWidth={2.2} />
                    </div>
                    <span className="text-[15px] font-medium">{t.createNewBot}</span>
                </button>
            </div>

            <div className="tg-card !p-0 overflow-hidden">
                <button
                    onClick={() => setSelectedBot(true)}
                    className="list-row w-full justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: 'var(--tg-accent)' }}>
                            <Bot size={24} strokeWidth={2} />
                        </div>
                        <div className="text-left">
                            <span className="text-[15px] font-semibold leading-tight block">FanGate</span>
                            <span className="text-[13px]" style={{ color: 'var(--tg-link)' }}>@Fan_Gate_Bot</span>
                        </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--tg-hint)', opacity: 0.5 }} />
                </button>
            </div>

            <p className="text-[12px] text-center px-8" style={{ color: 'var(--tg-hint)' }}>
                {t.botAdminHint}
            </p>
        </div>
    );
}
