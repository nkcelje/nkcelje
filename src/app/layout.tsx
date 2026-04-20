import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { SquadProvider } from '@/context/SquadContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nProvider } from '@/context/I18nContext';

const themeInitScript = `(function(){try{var t=localStorage.getItem('nk-theme')||'dark';document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('nk-lang')||'ru';document.documentElement.setAttribute('data-lang',l);document.documentElement.setAttribute('lang',l);}catch(e){document.documentElement.setAttribute('data-theme','dark');document.documentElement.setAttribute('data-lang','ru');document.documentElement.setAttribute('lang','ru');}})();`;

export const metadata: Metadata = {
  title: 'NKCE_AI — Аналитика и рекрутинг НК Целе',
  description: 'Профессиональная платформа оценки игроков, планирования состава и скаутинга для НК Целе.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-void text-text-primary antialiased">
        <ThemeProvider>
          <I18nProvider>
          <SquadProvider>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-1 min-h-0 overflow-hidden">
                {children}
              </main>
            </div>
          </SquadProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
