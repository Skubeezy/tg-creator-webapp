'use client';

import React from 'react';
import { X } from 'lucide-react';
import { TranslationDict } from '@/lib/translations';
import { createPortal } from 'react-dom';

interface LegalModalProps {
    type: 'terms' | 'privacy' | null;
    onClose: () => void;
    t: TranslationDict;
}

export function LegalModal({ type, onClose, t }: LegalModalProps) {
    if (!type || typeof document === 'undefined') return null;

    const isRu = t.isRu;

    // Content dictionaries
    const title = type === 'terms'
        ? (isRu ? 'Пользовательское соглашение' : 'Terms of Service')
        : (isRu ? 'Политика конфиденциальности' : 'Privacy Policy');

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
            onClick={onClose}>

            <div className="w-full max-w-[400px] h-[80vh] bg-[var(--tg-bg)] rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col"
                style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--tg-separator)]">
                    <h2 className="text-[18px] font-bold text-[var(--tg-text)]">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-[var(--tg-hint)]/10 text-[var(--tg-hint)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 text-[14px] leading-relaxed text-[var(--tg-text)] space-y-4">
                    {type === 'terms' ? (
                        <>
                            <h3 className="font-bold text-[16px]">{isRu ? "1. Введение" : "1. Introduction"}</h3>
                            <p>{isRu ? "Используя наших ботов, вы соглашаетесь с данными условиями. Платформа FanGate предоставляет инструменты для монетизации контента через Telegram Stars." : "By using our bots, you agree to these terms. The FanGate platform provides tools to monetize content via Telegram Stars."}</p>

                            <h3 className="font-bold text-[16px] mt-4">{isRu ? "2. Подписки и Оплата" : "2. Subscriptions & Payments"}</h3>
                            <p>{isRu ? "Все платежи обрабатываются через официальные методы Telegram (Stars, Telegram Pay) и внешние провайдеры для криптовалют. Средства зачисляются автору с вычетом комиссии платформы." : "All payments are processed via official Telegram methods (Stars, Telegram Pay) and external crypto providers. Funds are credited to the creator after our platform fee."}</p>

                            <h3 className="font-bold text-[16px] mt-4">{isRu ? "3. Возвраты" : "3. Refunds"}</h3>
                            <p>{isRu ? "Возвраты обрабатываются в индивидуальном порядке через поддержку. Цифровые товары обычно не подлежат возврату после получения доступа к контенту." : "Refunds are processed on a case-by-case basis via support. Digital goods are generally non-refundable once access is granted."}</p>

                            <h3 className="font-bold text-[16px] mt-4">{isRu ? "4. Ответственность" : "4. Liability"}</h3>
                            <p>{isRu ? "Мы не несем прямой ответственности за контент, публикуемый авторами в их закрытых каналах. При нарушении правил Telegram бот или канал может быть заблокирован." : "We are not directly liable for the content published by creators in their private channels. If Telegram rules are violated, the bot or channel may be banned."}</p>
                        </>
                    ) : (
                        <>
                            <h3 className="font-bold text-[16px]">{isRu ? "1. Сбор данных" : "1. Data Collection"}</h3>
                            <p>{isRu ? "Мы собираем только минимально необходимую информацию от Telegram: ваш ID, имя профиля и язык. Мы не имеем доступа к вашим личным перепискам или телефону (если вы его не передали добровольно)." : "We collect only the minimum necessary information from Telegram: your ID, profile name, and language. We do not have access to your personal messages or phone number (unless voluntarily provided)."}</p>

                            <h3 className="font-bold text-[16px] mt-4">{isRu ? "2. Использование данных" : "2. Data Usage"}</h3>
                            <p>{isRu ? "Ваш Telegram ID используется исключительно для идентификации подписок, начислений баланса и выдачи прав доступа к приватным каналам/группам." : "Your Telegram ID is used exclusively to identify subscriptions, track balances, and grant access to private channels/groups."}</p>

                            <h3 className="font-bold text-[16px] mt-4">{isRu ? "3. Защита информации" : "3. Information Security"}</h3>
                            <p>{isRu ? "Наши серверы используют современные методы шифрования. Ключи и токены хранятся в защищенной среде, обеспечивая сохранность данных пользователей." : "Our servers use modern encryption methods. Keys and tokens are stored in a secure environment, ensuring the safety of user data."}</p>

                            <h3 className="font-bold text-[16px] mt-4">{isRu ? "4. Передача третьим лицам" : "4. Third Parties"}</h3>
                            <p>{isRu ? "Ваши данные не продаются и не передаются рекламным компаниям. Данные могут быть переданы только платежным провайдерам для обеспечения транзакций." : "Your data is not sold or transferred to advertising companies. Data may only be shared with payment providers to facilitate transactions."}</p>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
