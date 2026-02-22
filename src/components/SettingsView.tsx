'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Sparkles, MessageSquare, Tag, Trash2, PlusCircle, Save } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { TranslationDict } from '@/lib/translations';

interface Plan {
    id?: string;
    durationDays: number;
    price: number;
    isNew?: boolean;
    isChanged?: boolean;
}

export function SettingsView({ API_URL, botId, onBack, onDeleted, t }: { API_URL: string, botId: string, onBack: () => void, onDeleted: () => void, t: TranslationDict }) {
    const [welcomeText, setWelcomeText] = useState(t.loading || "Загрузка...");
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
                        const rawPlans = bot.subscriptionPlans || [];
                        setPlans(rawPlans.map((p: any) => ({
                            id: p.id,
                            durationDays: p.durationDays,
                            price: Number(p.price)
                        })).sort((a: Plan, b: Plan) => a.durationDays - b.durationDays));
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

    const handleSaveGeneral = async () => {
        if (!WebApp.initData) return;
        setIsLoading(true);
        WebApp.MainButton.showProgress();
        try {
            const res = await fetch(`${API_URL}/me/config`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${WebApp.initData}`
                },
                body: JSON.stringify({ welcomeText })
            });
            if (res.ok) {
                WebApp.showAlert(t.settingsSaved || "Настройки сохранены");
            } else {
                WebApp.showAlert("Ошибка при сохранении");
            }
        } catch (e) {
            WebApp.showAlert("Ошибка сети");
        } finally {
            setIsLoading(false);
            WebApp.MainButton.hideProgress();
        }
    };

    const handleSavePlan = async (plan: Plan, index: number) => {
        if (!WebApp.initData) return;
        try {
            if (plan.isNew) {
                const res = await fetch(`${API_URL}/me/bots/${botId}/plans`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${WebApp.initData}`
                    },
                    body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price })
                });
                if (res.ok) {
                    const data = await res.json();
                    const newPlans = [...plans];
                    newPlans[index] = { ...data.plan, price: Number(data.plan.price) };
                    setPlans(newPlans);
                }
            } else if (plan.id && plan.isChanged) {
                const res = await fetch(`${API_URL}/me/plans/${plan.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${WebApp.initData}`
                    },
                    body: JSON.stringify({ durationDays: plan.durationDays, price: plan.price })
                });
                if (res.ok) {
                    const newPlans = [...plans];
                    newPlans[index].isChanged = false;
                    setPlans(newPlans);
                }
            }
        } catch (e) {
            WebApp.showAlert("Ошибка сохранения тарифа");
        }
    };

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
        setPlans([...plans, { durationDays: 30, price: 100, isNew: true }]);
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
                    <button
                        onClick={handleSaveGeneral}
                        disabled={isLoading}
                        className="mt-3 w-full bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] rounded-xl py-3 font-semibold active:opacity-80 transition-opacity"
                    >
                        {t.saveSettings || "Сохранить текст"}
                    </button>
                </div>
            </section>

            {/* Subscription Plans */}
            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                    <Tag size={18} className="opacity-60" />
                    <h2 className="font-bold">{t.subscriptionPlans || "Тарифы подписки (Telegram Stars)"}</h2>
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
                                    <Sparkles size={16} className="text-yellow-500" />
                                </div>
                            </div>

                            <div className="flex justify-end items-center gap-2 mt-2">
                                {(plan.isNew || plan.isChanged) && (
                                    <button onClick={() => handleSavePlan(plan, i)} className="text-blue-500 flex items-center gap-1 text-sm font-medium px-2 py-1 bg-blue-500/10 rounded-md">
                                        <Save size={14} /> Сохранить
                                    </button>
                                )}
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
        </div>
    );
}
