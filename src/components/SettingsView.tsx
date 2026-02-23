'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Sparkles, MessageSquare, Tag, Trash2, PlusCircle, Save, Loader2, Wallet } from 'lucide-react';
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

export function SettingsView({ API_URL, botId, onBack, onDeleted, t }: { API_URL: string, botId: string, onBack: () => void, onDeleted: () => void, t: TranslationDict }) {
    const [welcomeText, setWelcomeText] = useState(t.loading || "Загрузка...");
    const [aiSystemPrompt, setAiSystemPrompt] = useState("");
    const [plans, setPlans] = useState<Plan[]>([]);
    const [paymentMethods, setPaymentMethods] = useState({ stars: true, crypto: true, card: true });

    // Initial state tracking for the global save banner
    const [initialWelcomeText, setInitialWelcomeText] = useState("");
    const [initialAiSystemPrompt, setInitialAiSystemPrompt] = useState("");
    const [initialPlans, setInitialPlans] = useState<Plan[]>([]);
    const [initialPaymentMethods, setInitialPaymentMethods] = useState({ stars: true, crypto: true, card: true });

    const [isLoading, setIsLoading] = useState(false);

    // Deep compare plans to detect unsaved changes
    const hasUnsavedPlans = useMemo(() => {
        if (plans.length !== initialPlans.length) return true;
        for (let i = 0; i < plans.length; i++) {
            const p1 = plans[i];
            const p2 = initialPlans[i];
            if (p1.durationDays !== p2.durationDays || p1.price !== p2.price || p1.currency !== p2.currency || p1.isNew || p1.isChanged) {
                return true;
            }
        }
        return false;
    }, [plans, initialPlans]);

    const hasUnsavedPaymentMethods =
        paymentMethods.stars !== initialPaymentMethods.stars ||
        paymentMethods.crypto !== initialPaymentMethods.crypto ||
        paymentMethods.card !== initialPaymentMethods.card;

    const hasUnsavedChanges = welcomeText !== initialWelcomeText || aiSystemPrompt !== initialAiSystemPrompt || hasUnsavedPlans || hasUnsavedPaymentMethods;

    const loadData = useCallback(async () => {
        if (typeof window !== 'undefined' && WebApp.initData) {
            try {
                // Fetch all bots to get this bot's plans and settings
                const res = await fetch(`${API_URL}/me/bots`, {
                    headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const bot = data.bots?.find((b: any) => b.id === botId);
                    if (bot) {
                        setWelcomeText((bot.settings as any)?.welcomeText || "🌟 Welcome!");

                        // Try fetching /me/config to get full settings and aiConfig
                        try {
                            const confRes = await fetch(`${API_URL}/me/config`, {
                                headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                            });
                            if (confRes.ok) {
                                const confData = await confRes.json();
                                if (confData.aiConfig?.systemPrompt) {
                                    setAiSystemPrompt(confData.aiConfig.systemPrompt);
                                    setInitialAiSystemPrompt(confData.aiConfig.systemPrompt);
                                }
                            }
                        } catch (e) { }

                        const rawPlans = bot.subscriptionPlans || [];
                        const mappedPlans = rawPlans.map((p: any) => ({
                            id: p.id,
                            durationDays: p.durationDays,
                            price: Number(p.price),
                            currency: 'USD'
                        })).sort((a: Plan, b: Plan) => a.durationDays - b.durationDays);

                        setPlans(mappedPlans);
                        setInitialPlans(JSON.parse(JSON.stringify(mappedPlans))); // Deep copy for initial state

                        const bSettings = bot.settings as any;
                        const wText = bSettings?.welcomeText || "🌟 Welcome!";
                        setWelcomeText(wText);
                        setInitialWelcomeText(wText);

                        const pMethods = bSettings?.paymentMethods || { stars: true, crypto: true, card: true };
                        setPaymentMethods(pMethods);
                        setInitialPaymentMethods({ ...pMethods });
                    }
                }
            } catch (e) {
                console.error("Failed to load bot data", e);
            }
        }
    }, [API_URL, botId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveAll = async () => {
        if (!WebApp.initData) return;
        setIsLoading(true);
        WebApp.MainButton.showProgress();

        try {
            // 1. Save Text, AI Prompt, and Payment Configs
            if (welcomeText !== initialWelcomeText || aiSystemPrompt !== initialAiSystemPrompt || hasUnsavedPaymentMethods) {
                const res = await fetch(`${API_URL}/me/config`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${WebApp.initData}`
                    },
                    body: JSON.stringify({ welcomeText, aiSystemPrompt, paymentMethods })
                });
                if (res.ok) {
                    setInitialWelcomeText(welcomeText);
                    setInitialAiSystemPrompt(aiSystemPrompt);
                    setInitialPaymentMethods({ ...paymentMethods });
                }
            }

            // 2. Save individual plans
            let newPlansState = [...plans];

            for (let i = 0; i < plans.length; i++) {
                const plan = plans[i];
                if (plan.isNew) {
                    const res = await fetch(`${API_URL}/me/bots/${botId}/plans`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${WebApp.initData}`
                        },
                        body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price, currency: plan.currency || 'XTR' })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        newPlansState[i] = { ...data.plan, price: Number(data.plan.price), isNew: false, isChanged: false };
                    }
                } else if (plan.id && plan.isChanged) {
                    const res = await fetch(`${API_URL}/me/plans/${plan.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${WebApp.initData}`
                        },
                        body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price, currency: plan.currency || 'XTR' })
                    });
                    if (res.ok) {
                        newPlansState[i].isChanged = false;
                    }
                }
            }

            setPlans(newPlansState);
            setInitialPlans(JSON.parse(JSON.stringify(newPlansState)));

            WebApp.showAlert(t.settingsSaved || "Настройки успешно сохранены!");
        } catch (e) {
            WebApp.showAlert("Ошибка при сохранении");
        } finally {
            setIsLoading(false);
            WebApp.MainButton.hideProgress();
        }
    };

    // ─── Telegram Native MainButton wiring (telegram-mini-app skill) ───
    // Placed AFTER handleSaveAll is declared to avoid "used before declaration" error
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (hasUnsavedChanges) {
            WebApp.MainButton.setText(t.saveSettings || '💾 Сохранить изменения');
            WebApp.MainButton.show();
            WebApp.MainButton.onClick(handleSaveAll);
        } else {
            WebApp.MainButton.hide();
            WebApp.MainButton.offClick(handleSaveAll);
        }

        return () => {
            WebApp.MainButton.offClick(handleSaveAll);
        };
    }, [hasUnsavedChanges, handleSaveAll]);

    const handleDeletePlan = async (index: number) => {
        if (!WebApp.initData) return;
        const plan = plans[index];
        if (plan.id && !plan.isNew) {
            WebApp.showConfirm("Удалить этот тариф?", async (confirm) => {
                if (confirm) {
                    try {
                        const res = await fetch(`${API_URL}/me/plans/${plan.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                        });
                        if (res.ok) {
                            setPlans(plans.filter((_, i) => i !== index));
                        }
                    } catch (e) {
                        WebApp.showAlert("Ошибка удаления");
                    }
                }
            });
        } else {
            setPlans(plans.filter((_, i) => i !== index));
        }
    };

    const handleAddPlanClick = () => {
        setPlans([...plans, { durationDays: 30, price: 10, currency: 'USD', isNew: true }]);
    };

    const handleDeleteBot = () => {
        WebApp.showConfirm("⚠️ Вы уверены, что хотите удалить этого бота? Это действие нельзя отменить, вебхуки будут остановлены.", async (confirm) => {
            if (confirm && WebApp.initData) {
                WebApp.MainButton.showProgress();
                try {
                    const res = await fetch(`${API_URL}/me/bots/${botId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${WebApp.initData}` }
                    });
                    if (res.ok) {
                        onDeleted();
                    } else {
                        WebApp.showAlert("Ошибка удаления бота");
                    }
                } catch (e) {
                    WebApp.showAlert("Ошибка сети");
                } finally {
                    WebApp.MainButton.hideProgress();
                }
            }
        });
    };

    const formatDays = (days: number) => {
        if (days === 1) return t.isRu ? "1 День" : "1 Day";
        if (days === 7) return t.isRu ? "1 Неделя" : "1 Week";
        if (days === 30) return t.isRu ? "1 Месяц" : "1 Month";
        if (days === 90) return t.isRu ? "3 Месяца" : "3 Months";
        if (days === 180) return t.isRu ? "6 Месяцев" : "6 Months";
        if (days === 365) return t.isRu ? "1 Год" : "1 Year";
        return `${days} ${t.isRu ? 'Дней' : 'Days'}`;
    };

    return (
        <div className="flex flex-col gap-5 w-full pb-24">
            <header className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-black/5 dark:active:bg-white/5 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{t.botSettings || "Настройки Бота"}</h1>
            </header>

            {/* Welcome Message */}
            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="opacity-60" />
                        <h2 className="font-bold">{t.welcomeMessage || "Приветственное сообщение"}</h2>
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-xs opacity-60 mb-2">Это сообщение увидит фанат, когда отправит /start вашему боту.</p>
                    <textarea
                        className="w-full bg-black/5 dark:bg-white/5 rounded-lg p-3 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)] transition-all resize-none"
                        value={welcomeText}
                        onChange={(e) => setWelcomeText(e.target.value)}
                    />
                </div>
            </section>

            {/* AI Assistant Settings */}
            <section className="tg-card !p-0 overflow-hidden border border-[var(--tg-theme-button-color)]/20">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-500" />
                        <h2 className="font-bold">Настройки ИИ (AI Agent)</h2>
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-xs opacity-60 mb-2">Опишите характер и правила общения для вашего ИИ-агента поддержки. Например: "Общайся как дерзкий фитнес-тренер, продавай подписку."</p>
                    <textarea
                        className="w-full bg-black/5 dark:bg-white/5 rounded-lg p-3 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)] transition-all resize-none"
                        value={aiSystemPrompt}
                        placeholder="Ты полезный ИИ-помощник..."
                        onChange={(e) => setAiSystemPrompt(e.target.value)}
                    />
                </div>
            </section>

            {/* Payment Methods */}
            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                    <Wallet size={18} className="opacity-60" />
                    <h2 className="font-bold">{t.isRu ? "Способы оплаты" : "Payment Methods"}</h2>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs opacity-60 mb-2">
                        {t.isRu ? "Выберите доступные способы оплаты для ваших подписчиков. Как минимум 1 должен быть включен." : "Choose available payment methods for your subscribers. At least 1 must be active."}
                    </p>

                    {[
                        { id: 'stars', label: t.isRu ? "Telegram Stars (⭐️)" : "Telegram Stars (⭐️)", key: 'stars' },
                        { id: 'crypto', label: t.isRu ? "Криптовалюта (CryptoPay)" : "Crypto (CryptoPay)", key: 'crypto' },
                        { id: 'card', label: t.isRu ? "Банковская карта (Stripe)" : "Bank Card (Stripe)", key: 'card' },
                    ].map((method) => {
                        const isChecked = (paymentMethods as any)[method.key];
                        return (
                            <div key={method.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <span className="font-medium text-sm">{method.label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const newVal = e.target.checked;
                                            const newMethods = { ...paymentMethods, [method.key]: newVal };
                                            // Ensure at least 1 is active
                                            if (!newMethods.stars && !newMethods.crypto && !newMethods.card) {
                                                WebApp.showAlert(t.isRu ? "Нельзя отключить все способы оплаты!" : "Cannot disable all payment methods!");
                                                return;
                                            }
                                            setPaymentMethods(newMethods);
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-black/20 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--tg-theme-button-color)]"></div>
                                </label>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Subscription Plans */}
            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                    <Tag size={18} className="opacity-60" />
                    <h2 className="font-bold">{t.subscriptionPlans || "Тарифы подписки"}</h2>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    {plans.map((plan, i) => (
                        <div key={plan.id || i} className="flex flex-col gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 relative group">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <select
                                        className="w-full bg-transparent outline-none font-medium appearance-none"
                                        value={plan.durationDays}
                                        onChange={(e) => {
                                            const newPlans = [...plans];
                                            newPlans[i].durationDays = Number(e.target.value);
                                            newPlans[i].isChanged = true;
                                            setPlans(newPlans);
                                        }}
                                    >
                                        <option value="1">1 День</option>
                                        <option value="7">1 Неделя</option>
                                        <option value="30">1 Месяц</option>
                                        <option value="90">3 Месяца</option>
                                        <option value="180">6 Месяцев</option>
                                        <option value="365">1 Год</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-lg p-1 px-3">
                                    <span className="font-bold text-[var(--tg-theme-link-color)] mr-1">$</span>
                                    <input
                                        type="number"
                                        value={plan.price}
                                        onChange={(e) => {
                                            const newPlans = [...plans];
                                            newPlans[i].price = Number(e.target.value);
                                            newPlans[i].isChanged = true;
                                            setPlans(newPlans);
                                        }}
                                        className="w-16 bg-transparent text-right outline-none font-bold text-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end items-center gap-2 mt-2">
                                <button onClick={() => handleDeletePlan(i)} className="text-red-500 flex items-center gap-1 text-sm font-medium px-2 py-1 bg-red-500/10 rounded-md">
                                    <Trash2 size={14} /> Удалить
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleAddPlanClick}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-black/20 dark:border-white/20 text-[var(--tg-theme-link-color)] active:bg-black/5 dark:active:bg-white/5 transition-colors"
                    >
                        <PlusCircle size={18} />
                        <span className="font-medium">Добавить тариф</span>
                    </button>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="tg-card !p-0 overflow-hidden border border-red-500/20">
                <div className="p-4">
                    <h2 className="font-bold text-red-500 mb-2">Опасная зона</h2>
                    <p className="text-xs opacity-60 mb-4">
                        Удаление бота навсегда отключит его и удалит все тарифы. У текущих фанатов останется доступ к каналу до истечения подписки, но бот перестанет работать.
                    </p>
                    <button
                        onClick={handleDeleteBot}
                        className="w-full bg-red-500/10 text-red-500 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 active:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={18} />
                        Удалить бота
                    </button>
                </div>
            </section>

            {/* Global Save Banner */}
            {
                hasUnsavedChanges && (
                    <div className="fixed bottom-0 left-0 w-full z-50 p-4 save-banner-anim-enter pointer-events-none">
                        <div className="pointer-events-auto bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-4 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-w-sm mx-auto w-full">
                            <div className="flex flex-col">
                                <span className="font-bold text-[15px]">Несохраненные изменения</span>
                                <span className="text-xs opacity-60">Пожалуйста, сохраните настройки.</span>
                            </div>
                            <button
                                onClick={handleSaveAll}
                                disabled={isLoading}
                                className="bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Сохранить
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
