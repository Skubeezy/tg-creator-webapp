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
            <h1 className="text-2xl font-bold mb-2">{t.myBots}</h1>

            {/* Create Bot Button - BotFather Style */}
            <div className="tg-card !p-0 overflow-hidden">
                <button
                    className="w-full p-4 flex items-center gap-4 transition-colors active:bg-black/5 dark:active:bg-white/5"
                    style={{ color: 'var(--tg-theme-button-color, #2563eb)' }}
                    onClick={() => {
                        // Normally this would start the bot creation flow in BotFather or show instructions
                        // For MVP, we'll pretend there is one bot and just open it
                        setSelectedBot(true);
                    }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-current">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium text-lg">{t.createNewBot}</span>
                </button>
            </div>

            {/* List of active bots */}
            <div className="tg-card !p-0 overflow-hidden">
                <button
                    onClick={() => setSelectedBot(true)}
                    className="w-full p-4 flex items-center justify-between transition-colors active:bg-black/5 dark:active:bg-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: 'var(--tg-theme-button-color, #2563eb)' }}>
                            <Bot size={28} />
                        </div>
                        <div className="text-left flex flex-col">
                            <span className="font-bold text-lg leading-tight">FanGate</span>
                            <span className="text-sm opacity-60" style={{ color: 'var(--tg-theme-link-color, #2563eb)' }}>@Fan_Gate_Bot</span>
                        </div>
                    </div>
                    <ChevronRight className="opacity-40" />
                </button>
            </div>

            <p className="text-xs text-center opacity-40 mt-4 px-4">
                {t.botAdminHint}
            </p>
        </div>
    );
}
