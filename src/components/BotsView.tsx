'use client';

import { useState } from 'react';
import { Plus, ChevronRight, Bot, Key, Loader2, CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { TranslationDict } from '@/lib/translations';

type WizardStep = 'token' | 'preview' | 'done';

export function BotsView({ API_URL, t }: { API_URL: string, t: TranslationDict }) {
    const isRu = t.dashboard === 'Дашборд';
    const [selectedBot, setSelectedBot] = useState<boolean>(false);
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState<WizardStep>('token');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [botInfo, setBotInfo] = useState<{ name: string; username: string } | null>(null);

    if (selectedBot) {
        return <SettingsView API_URL={API_URL} onBack={() => setSelectedBot(false)} t={t} />;
    }

    const handleTokenSubmit = async () => {
        if (!token.trim()) return;
        setIsLoading(true);

        // Simulate bot info fetch (in production this would call the backend)
        setTimeout(() => {
            // Extract bot username from token format or use placeholder
            setBotInfo({
                name: 'My Bot',
                username: '@my_bot',
            });
            setIsLoading(false);
            setWizardStep('preview');
        }, 1500);
    };

    const handleCreateBot = () => {
        setWizardStep('done');
        setTimeout(() => {
            setShowWizard(false);
            setWizardStep('token');
            setToken('');
            setBotInfo(null);
        }, 1200);
    };

    // ─── Bot Creation Wizard ───
    if (showWizard) {
        return (
            <div className="flex flex-col gap-4 w-full">
                <header className="flex items-center gap-3 px-1">
                    <button onClick={() => { setShowWizard(false); setWizardStep('token'); setToken(''); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'color-mix(in srgb, var(--tg-hint) 12%, transparent)' }}>
                        <ArrowLeft size={18} style={{ color: 'var(--tg-accent)' }} />
                    </button>
                    <h1 className="text-[18px] font-bold" style={{ letterSpacing: '-0.02em' }}>{t.createNewBot}</h1>
                </header>

                {wizardStep === 'token' && (
                    <div className="flex flex-col gap-4">
                        <div className="tg-card flex flex-col gap-3">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                                        style={{ background: 'rgba(51, 144, 236, 0.1)', color: 'var(--tg-accent)' }}>
                                        <Key size={20} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-semibold">Bot Token</p>
                                        <p className="text-[12px]" style={{ color: 'var(--tg-hint)' }}>
                                            {isRu ? 'Получите в @BotFather' : 'Get it from @BotFather'}
                                        </p>
                                    </div>
                                </div>
                                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--tg-accent) 12%, transparent)', color: 'var(--tg-accent)' }}>
                                    @BotFather <ExternalLink size={11} />
                                </a>
                            </div>
                            <input
                                type="text"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                className="w-full rounded-[12px] px-4 py-3 text-[14px] outline-none"
                                style={{
                                    background: 'color-mix(in srgb, var(--tg-hint) 8%, transparent)',
                                    color: 'var(--tg-text)',
                                    border: '1px solid color-mix(in srgb, var(--tg-hint) 15%, transparent)'
                                }}
                            />
                        </div>
                        <button
                            className="action-btn"
                            onClick={handleTokenSubmit}
                            disabled={!token.trim() || isLoading}
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                isRu ? 'Подключить бота' : 'Connect Bot'
                            )}
                        </button>
                    </div>
                )}

                {wizardStep === 'preview' && botInfo && (
                    <div className="flex flex-col gap-4">
                        <div className="tg-card flex flex-col items-center gap-3 py-6">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: 'var(--tg-accent)' }}>
                                <Bot size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-[17px] font-bold">{botInfo.name}</p>
                                <p className="text-[13px]" style={{ color: 'var(--tg-link)' }}>{botInfo.username}</p>
                            </div>
                        </div>

                        {/* Default plans */}
                        <p className="section-header">{isRu ? 'Тарифы по умолчанию' : 'Default Plans'}</p>
                        <div className="tg-card !p-0 overflow-hidden">
                            <div className="list-row justify-between">
                                <span className="text-[15px]">{isRu ? '1 Неделя' : '1 Week'}</span>
                                <span className="text-[15px] font-semibold" style={{ color: 'var(--tg-accent)' }}>$10</span>
                            </div>
                            <div className="list-separator" style={{ marginLeft: '16px' }} />
                            <div className="list-row justify-between">
                                <span className="text-[15px]">{isRu ? '1 Месяц' : '1 Month'}</span>
                                <span className="text-[15px] font-semibold" style={{ color: 'var(--tg-accent)' }}>$25</span>
                            </div>
                        </div>

                        <p className="text-[12px] text-center" style={{ color: 'var(--tg-hint)' }}>
                            {isRu ? 'Вы сможете изменить тарифы позже' : 'You can change plans later'}
                        </p>

                        <button className="action-btn" onClick={handleCreateBot}>
                            {isRu ? 'Создать бота' : 'Create Bot'}
                        </button>
                    </div>
                )}

                {wizardStep === 'done' && (
                    <div className="tg-card flex flex-col items-center gap-3 py-10">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(52, 199, 89, 0.12)', color: '#34c759' }}>
                            <CheckCircle size={32} strokeWidth={1.8} />
                        </div>
                        <p className="text-[17px] font-bold">{isRu ? 'Бот создан!' : 'Bot Created!'}</p>
                    </div>
                )}
            </div>
        );
    }

    // ─── Bot List ───
    return (
        <div className="flex flex-col gap-4 w-full">
            <h1 className="text-[22px] font-bold px-1" style={{ letterSpacing: '-0.02em' }}>{t.myBots}</h1>

            <div className="tg-card !p-0 overflow-hidden">
                <button
                    className="list-row w-full gap-3"
                    style={{ color: 'var(--tg-accent)' }}
                    onClick={() => setShowWizard(true)}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(51, 144, 236, 0.1)' }}>
                        <Plus size={22} strokeWidth={2.2} />
                    </div>
                    <span className="text-[15px] font-medium">{t.createNewBot}</span>
                </button>
            </div>

            <p className="text-[12px] text-center px-8" style={{ color: 'var(--tg-hint)' }}>
                {t.botAdminHint}
            </p>
        </div>
    );
}
