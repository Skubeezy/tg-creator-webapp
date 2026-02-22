'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronRight, Bot, Key, Loader2, CheckCircle, ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { TranslationDict } from '@/lib/translations';
import WebApp from '@twa-dev/sdk';

type WizardStep = 'token' | 'preview' | 'done';

interface BotData {
    id: number;
    name: string;
    username: string;
    token: string;
    photoUrl?: string;
    plans: { period: string; price: number }[];
}

export function BotsView({ API_URL, t }: { API_URL: string, t: TranslationDict }) {
    const isRu = t.dashboard === 'Дашборд';
    const [bots, setBots] = useState<BotData[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState<WizardStep>('token');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [botInfo, setBotInfo] = useState<{ id: number; name: string; username: string; photoUrl?: string } | null>(null);
    const [error, setError] = useState('');
    const [viewAnim, setViewAnim] = useState('view-enter');

    // Load saved bots from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('fangate_bots');
            if (saved) {
                try { setBots(JSON.parse(saved)); } catch (_) { }
            }
        }
    }, []);

    // Save bots to localStorage
    const saveBots = (newBots: BotData[]) => {
        setBots(newBots);
        localStorage.setItem('fangate_bots', JSON.stringify(newBots));
    };

    // If a bot is selected, show its settings
    if (selectedBotId !== null) {
        return (
            <div className={viewAnim}>
                <SettingsView
                    API_URL={API_URL}
                    onBack={() => {
                        setViewAnim('view-enter-back');
                        setSelectedBotId(null);
                    }}
                    t={t}
                />
            </div>
        );
    }

    // Verify token via Telegram Bot API
    const handleTokenSubmit = async () => {
        if (!token.trim()) return;
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`);
            const data = await res.json();

            if (data.ok && data.result) {
                const bot = data.result;
                // Try to get bot's profile photo
                let photoUrl: string | undefined;
                try {
                    const photoRes = await fetch(`https://api.telegram.org/bot${token.trim()}/getUserProfilePhotos?user_id=${bot.id}&limit=1`);
                    const photoData = await photoRes.json();
                    if (photoData.ok && photoData.result.total_count > 0) {
                        const fileId = photoData.result.photos[0][0].file_id;
                        const fileRes = await fetch(`https://api.telegram.org/bot${token.trim()}/getFile?file_id=${fileId}`);
                        const fileData = await fileRes.json();
                        if (fileData.ok) {
                            photoUrl = `https://api.telegram.org/file/bot${token.trim()}/${fileData.result.file_path}`;
                        }
                    }
                } catch (_) { }

                setBotInfo({
                    id: bot.id,
                    name: bot.first_name,
                    username: `@${bot.username}`,
                    photoUrl
                });
                setWizardStep('preview');
            } else {
                setError(isRu ? 'Неверный токен. Проверьте и попробуйте снова.' : 'Invalid token. Please check and try again.');
            }
        } catch (_) {
            setError(isRu ? 'Ошибка сети. Попробуйте снова.' : 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBot = () => {
        if (!botInfo) return;

        const newBot: BotData = {
            id: botInfo.id,
            name: botInfo.name,
            username: botInfo.username,
            token: token.trim(),
            photoUrl: botInfo.photoUrl,
            plans: [
                { period: isRu ? '1 Неделя' : '1 Week', price: 10 },
                { period: isRu ? '1 Месяц' : '1 Month', price: 25 }
            ]
        };

        saveBots([...bots, newBot]);
        setWizardStep('done');

        setTimeout(() => {
            setShowWizard(false);
            setWizardStep('token');
            setToken('');
            setBotInfo(null);
            setError('');
        }, 1200);
    };

    const removeBot = (id: number) => {
        saveBots(bots.filter(b => b.id !== id));
    };

    // ─── Bot Creation Wizard ───
    if (showWizard) {
        return (
            <div className="flex flex-col gap-4 w-full view-enter">
                <header className="flex items-center gap-3 px-1">
                    <button onClick={() => { setShowWizard(false); setWizardStep('token'); setToken(''); setError(''); }}
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
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--tg-accent) 12%, transparent)', color: 'var(--tg-accent)' }}>
                                    @BotFather <ExternalLink size={11} />
                                </a>
                            </div>
                            <input
                                type="text"
                                value={token}
                                onChange={e => { setToken(e.target.value); setError(''); }}
                                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                className="w-full rounded-[12px] px-4 py-3 text-[14px] outline-none"
                                style={{
                                    background: 'color-mix(in srgb, var(--tg-hint) 8%, transparent)',
                                    color: 'var(--tg-text)',
                                    border: `1px solid ${error ? '#ff3b30' : 'color-mix(in srgb, var(--tg-hint) 15%, transparent)'}`
                                }}
                            />
                            {error && (
                                <p className="text-[12px]" style={{ color: '#ff3b30' }}>{error}</p>
                            )}
                        </div>
                        <button className="action-btn" onClick={handleTokenSubmit} disabled={!token.trim() || isLoading}>
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                isRu ? 'Подключить бота' : 'Connect Bot'
                            )}
                        </button>
                    </div>
                )}

                {wizardStep === 'preview' && botInfo && (
                    <div className="flex flex-col gap-4 view-enter">
                        <div className="tg-card flex flex-col items-center gap-3 py-6">
                            {botInfo.photoUrl ? (
                                <img src={botInfo.photoUrl} alt={botInfo.name}
                                    className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                                    style={{ backgroundColor: 'var(--tg-accent)' }}>
                                    <Bot size={32} />
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-[17px] font-bold">{botInfo.name}</p>
                                <p className="text-[13px]" style={{ color: 'var(--tg-link)' }}>{botInfo.username}</p>
                            </div>
                        </div>

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
                    <div className="tg-card flex flex-col items-center gap-3 py-10 view-enter">
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
        <div className={`flex flex-col gap-4 w-full ${viewAnim}`}>
            <h1 className="text-[22px] font-bold px-1" style={{ letterSpacing: '-0.02em' }}>{t.myBots}</h1>

            <div className="tg-card !p-0 overflow-hidden">
                <button
                    className="list-row w-full gap-3"
                    style={{ color: 'var(--tg-accent)' }}
                    onClick={() => { setViewAnim('view-enter'); setShowWizard(true); }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(51, 144, 236, 0.1)' }}>
                        <Plus size={22} strokeWidth={2.2} />
                    </div>
                    <span className="text-[15px] font-medium">{t.createNewBot}</span>
                </button>
            </div>

            {/* Saved bots */}
            {bots.length > 0 && (
                <div className="tg-card !p-0 overflow-hidden">
                    {bots.map((bot, idx) => (
                        <div key={bot.id}>
                            <button
                                onClick={() => { setViewAnim('view-enter'); setSelectedBotId(bot.id); }}
                                className="list-row w-full justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {bot.photoUrl ? (
                                        <img src={bot.photoUrl} alt={bot.name}
                                            className="w-11 h-11 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0"
                                            style={{ backgroundColor: 'var(--tg-accent)' }}>
                                            <Bot size={24} strokeWidth={2} />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <span className="text-[15px] font-semibold leading-tight block">{bot.name}</span>
                                        <span className="text-[13px]" style={{ color: 'var(--tg-link)' }}>{bot.username}</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ color: 'var(--tg-hint)', opacity: 0.5 }} />
                            </button>
                            {idx < bots.length - 1 && <div className="list-separator" />}
                        </div>
                    ))}
                </div>
            )}

            <p className="text-[12px] text-center px-8" style={{ color: 'var(--tg-hint)' }}>
                {t.botAdminHint}
            </p>
        </div>
    );
}
