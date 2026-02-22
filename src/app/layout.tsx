import './globals.css';
import { WebAppProvider } from '@/components/WebAppProvider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Creator Dashboard',
    description: 'Telegram SaaS Platform WebApp',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                {/* Important script for Telegram Web App SDK */}
                <script src="https://telegram.org/js/telegram-web-app.js" async></script>
            </head>
            <body className={inter.className}>
                <WebAppProvider>
                    {children}
                </WebAppProvider>
            </body>
        </html>
    );
}
