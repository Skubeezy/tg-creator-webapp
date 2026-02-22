'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, MessageSquare, Tag } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { TranslationDict } from '@/lib/translations';

export function SettingsView({ API_URL, onBack, t }: { API_URL: string, onBack: () => void, t: TranslationDict }) {
    const [welcomeText, setWelcomeText] = useState(t.loading);
    const [price1M, setPrice1M] = useState(100);
    const [price3M, setPrice3M] = useState(250);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                if (typeof window !== 'undefined' && WebApp.initData) {
                    const res = await fetch(`${API_URL}/me/config`, {
                        headers: {
                            'Authorization': `Bearer ${WebApp.initData}`
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.settings) {
                            setWelcomeText(data.settings.welcomeText || "");
                            setPrice1M(data.settings.price1M || 100);
                            setPrice3M(data.settings.price3M || 250);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load config", e);
            }
        };

        fetchConfig();

        if (typeof window !== 'undefined' && WebApp.initData) {
            WebApp.MainButton.text = t.saveSettings;
            WebApp.MainButton.color = WebApp.themeParams.button_color || "#2481cc";
            WebApp.MainButton.textColor = WebApp.themeParams.button_text_color || "#ffffff";
            WebApp.MainButton.show();

            const handleMainButtonClick = async () => {
                WebApp.MainButton.showProgress();
                try {
                    const res = await fetch(`${API_URL}/me/config`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${WebApp.initData}`
                        },
                        body: JSON.stringify({
                            welcomeText,
                            price1M,
                            price3M
                        })
                    });

                    if (res.ok) {
                        WebApp.showAlert(t.settingsSaved);
                    } else {
                        WebApp.showAlert(t.saveErrorSignature);
                    }
                } catch (e) {
                    WebApp.showAlert(t.networkError);
                } finally {
                    WebApp.MainButton.hideProgress();
                }
            };

            WebApp.MainButton.onClick(handleMainButtonClick);

            return () => {
                if (typeof window !== 'undefined' && WebApp.initData) {
                    WebApp.MainButton.hide();
                    WebApp.MainButton.offClick(handleMainButtonClick);
                }
            };
        }
    }, [API_URL, welcomeText, price1M, price3M, t]);

    return (
        <div className="flex flex-col gap-5 pb-24 w-full">
            <header className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-black/5 dark:active:bg-white/5 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{t.botSettings}</h1>
            </header>

            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                    <MessageSquare size={18} className="opacity-60" />
                    <h2 className="font-bold">{t.welcomeMessage}</h2>
                </div>
                <div className="p-4">
                    <p className="text-xs opacity-60 mb-2">{t.welcomeHint}</p>
                    <textarea
                        className="w-full bg-black/5 dark:bg-white/5 rounded-lg p-3 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)] transition-all resize-none"
                        value={welcomeText}
                        onChange={(e) => setWelcomeText(e.target.value)}
                    />
                </div>
            </section>

            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                    <Tag size={18} className="opacity-60" />
                    <h2 className="font-bold">{t.subscriptionPlans}</h2>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="font-medium">{t.monthAccess_1}</div>
                        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg p-1 px-3">
                            <input
                                type="number"
                                value={price1M}
                                onChange={(e) => setPrice1M(Number(e.target.value))}
                                className="w-16 bg-transparent text-right outline-none font-bold"
                            />
                            <Sparkles size={16} className="text-yellow-500" />
                        </div>
                    </div>
                    <div className="w-full h-px bg-black/5 dark:bg-white/5"></div>
                    <div className="flex justify-between items-center">
                        <div className="font-medium">{t.monthAccess_3}</div>
                        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg p-1 px-3">
                            <input
                                type="number"
                                value={price3M}
                                onChange={(e) => setPrice3M(Number(e.target.value))}
                                className="w-16 bg-transparent text-right outline-none font-bold"
                            />
                            <Sparkles size={16} className="text-yellow-500" />
                        </div>
                    </div>
                </div>
            </section>

            <p className="text-xs text-center opacity-40 px-4">
                {t.themeHint}
            </p>
        </div>
    );
}
