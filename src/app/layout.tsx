import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { SquadProvider } from '@/context/SquadContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nProvider } from '@/context/I18nContext';
import { ColumnPrefsProvider } from '@/context/ColumnPrefsContext';
import { PitchViewProvider } from '@/context/PitchViewContext';

const themeInitScript = `(function(){try{var t=localStorage.getItem('nk-theme')||'dark';document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('nk-lang')||'ru';document.documentElement.setAttribute('data-lang',l);document.documentElement.setAttribute('lang',l);}catch(e){document.documentElement.setAttribute('data-theme','dark');document.documentElement.setAttribute('data-lang','ru');document.documentElement.setAttribute('lang','ru');}})();`;

export const metadata: Metadata = {
  title: 'ALGORYTHM — NK Celje · Performance & Recruitment',
  description: 'Аналитика выступлений и скаутинг для НК Целе.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <I18nProvider>
            <ColumnPrefsProvider>
              <PitchViewProvider>
                <SquadProvider>
                  <div className="app">
                    <Navigation />
                    <main style={{ minHeight: 0 }}>{children}</main>
                  </div>
                </SquadProvider>
              </PitchViewProvider>
            </ColumnPrefsProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
