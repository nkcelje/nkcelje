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
        {/*
          Инлайн-скрипт до гидратации проставляет data-theme / data-lang / lang
          на <html>, чтобы не моргало темой и языком. Варнинг про hydration
          mismatch здесь возникает, когда браузерное расширение или Next
          dev-runtime вставляет свои узлы в <head> раньше нас: React
          натыкается не на этот <script>, а на чужой пустой. suppressHydrationWarning
          на <html> на потомков не распространяется, поэтому флаг нужен
          непосредственно здесь.
        */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      {/*
        suppressHydrationWarning на <body>: некоторые браузерные расширения
        (например, Bitdefender TrafficLight — атрибуты `bis_register` и
        `__processed_<uuid>__`) вешают свои маркеры на <body> до hydration.
        Это не наш код, на поведение не влияет.
      */}
      <body
        suppressHydrationWarning
        className="bg-void text-text-primary antialiased"
      >
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
