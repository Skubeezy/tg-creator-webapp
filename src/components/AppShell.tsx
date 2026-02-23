'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutDashboard, Bot, Wallet } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { DashboardView } from '@/components/DashboardView';
import { BotsView } from '@/components/BotsView';
import { PayoutsView } from '@/components/PayoutsView';
import { getTranslation } from '@/lib/translations';

export default function AppShell() {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [langCode, setLangCode] = useState<string>('en');
    const [userName, setUserName] = useState<string>('Creator');

    // Swipe state
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [windowWidth, setWindowWidth] = useState(300);
    const startX = useRef(0);
    const startY = useRef(0);
    const isHorizontal = useRef<boolean | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
            const user = WebApp.initDataUnsafe?.user;
            if (user?.language_code) setLangCode(user.language_code);
            if (user?.first_name) setUserName(user.first_name);
        }
        try { WebApp.ready(); } catch (_) { }
        const t = setTimeout(() => setIsMounted(true), 800);
        return () => clearTimeout(t);
    }, []);

    const t = useMemo(() => getTranslation(langCode), [langCode]);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tg-creator-saas.onrender.com/api/bots";
    const tabLabels = useMemo(() => [t.dashboard, t.myBots, t.payouts], [t]);

    const handleTabChange = useCallback((idx: number) => {
        setActiveIndex(idx);
        setDragOffset(0);
    }, []);

    // ─── Touch Swipe Handlers ───
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isHorizontal.current = null;
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - startX.current;
        const dy = e.touches[0].clientY - startY.current;

        // Determine direction on first significant movement
        if (isHorizontal.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }

        if (!isHorizontal.current) return;

        // Prevent vertical scroll when swiping horizontally
        e.preventDefault();

        // Rubber band effect at edges
        let offset = dx;
        if ((activeIndex === 0 && dx > 0) || (activeIndex === 2 && dx < 0)) {
            offset = dx * 0.25;
        }
        setDragOffset(offset);
    }, [isDragging, activeIndex]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        isHorizontal.current = null;

        const threshold = windowWidth * 0.2;
        if (dragOffset < -threshold && activeIndex < 2) {
            setActiveIndex(prev => prev + 1);
        } else if (dragOffset > threshold && activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        }
        setDragOffset(0);
    }, [dragOffset, activeIndex]);

    // Calculate carousel transform
    const trackTransform = useMemo(() => {
        const base = -(activeIndex * 100);
        const pxOffset = dragOffset;
        return `translateX(calc(${base}% + ${pxOffset}px))`;
    }, [activeIndex, dragOffset]);

    if (!isMounted) {
        return (
            <div className="launch-screen">
                <div className="launch-logo">
                    <Bot size={36} color="white" strokeWidth={2} />
                </div>
                <div className="launch-text">FanGate</div>
                <div className="launch-spinner" />
            </div>
        );
    }

    return (
        <main className="app-shell">
            <div
                ref={trackRef}
                className="carousel-track"
                style={{
                    transform: trackTransform,
                    transition: isDragging ? 'none' : undefined
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="carousel-slide">
                    <DashboardView API_URL={API_URL} t={t} userName={userName} />
                </div>
                <div className="carousel-slide">
                    <BotsView API_URL={API_URL} t={t} />
                </div>
                <div className="carousel-slide">
                    <PayoutsView API_URL={API_URL} t={t} />
                </div>
            </div>

            <nav className="tab-bar">
                <div className="tab-bar-inner">
                    <div className="tab-pill" style={{
                        transform: `translateX(${(activeIndex - dragOffset / windowWidth) * 100}%)`,
                        transition: isDragging ? 'none' : undefined
                    }} />
                    {[LayoutDashboard, Bot, Wallet].map((Icon, idx) => (
                        <button
                            key={idx}
                            className={`tab-item ${activeIndex === idx ? 'active' : ''}`}
                            onClick={() => handleTabChange(idx)}
                        >
                            <Icon size={24} strokeWidth={activeIndex === idx ? 2.4 : 1.6} />
                            <span>{tabLabels[idx]}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </main>
    );
}
