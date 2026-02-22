'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, MessageSquare, Tag } from 'lucide-react';
import Link from 'next/link';
import WebApp from '@twa-dev/sdk';

export default function SettingsPage() {
    const [welcomeText, setWelcomeText] = useState("Загрузка...");
    const [price1M, setPrice1M] = useState(100);
    const [price3M, setPrice3M] = useState(250);
    const [isSaving, setIsSaving] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://td2mqh-ip-85-114-195-120.tunnelmole.net/api/bots";

    useEffect(() => {
        // 1. Fetch current config from Backend
        const fetchConfig = async () => {
            try {
                if (typeof window !== 'undefined' && WebApp.initData) {
                    const res = await fetch(`${API_URL}/me/config`, {
                        headers: {
                            // The critical security hash
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
                console.error("Failed to load generic config", e);
            }
        };

        fetchConfig();

        // Setup MainButton only once
        if (typeof window !== 'undefined' && WebApp.initData) {
            WebApp.MainButton.text = "СОХРАНИТЬ НАСТРОЙКИ";
            WebApp.MainButton.color = WebApp.themeParams.button_color || "#2481cc";
            WebApp.MainButton.textColor = WebApp.themeParams.button_text_color || "#ffffff";
            WebApp.MainButton.show();

            // Define the click handler
            const handleMainButtonClick = async () => {
                WebApp.MainButton.showProgress();
                try {
                    // 2. Save settings back to Server
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
                        WebApp.showAlert("✅ Настройки успешно сохранены!");
                    } else {
                        WebApp.showAlert("Ошибка сохранения: Неверная подпись WebApp");
                    }
                } catch (e) {
                    WebApp.showAlert("Ошибка сети");
                } finally {
                    WebApp.MainButton.hideProgress();
                }
            };

            WebApp.MainButton.onClick(handleMainButtonClick);

            return () => {
                // Cleanup
                if (typeof window !== 'undefined' && WebApp.initData) {
                    WebApp.MainButton.hide();
                    WebApp.MainButton.offClick(handleMainButtonClick); // Remove the specific handler
                }
            };
        }
    }, [welcomeText, price1M, price3M]); // Dependencies for the effect to re-run and update the closure for handleMainButtonClick

    return (
        <main className="p-4 flex flex-col gap-5 pb-24">
            <header className="flex items-center gap-3">
                <Link href="/" className="p-2 -ml-2 rounded-full active:bg-black/5">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-bold">Настройки Бота</h1>
            </header>

            {/* Greetings Text Setup */}
            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                    <MessageSquare size={18} className="opacity-60" />
                    <h2 className="font-bold">Приветственное сообщение</h2>
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

            {/* Pricing / Subscriptions */}
            <section className="tg-card !p-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                    <Tag size={18} className="opacity-60" />
                    <h2 className="font-bold">Тарифы подписки (Telegram Stars)</h2>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="font-medium">1 Месяц доступа</div>
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
                        <div className="font-medium">3 Месяца (Скидка)</div>
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
                Цвета и шрифты приложения автоматически адаптируются под вашу тему Telegram.
            </p>

        </main>
    );
}
