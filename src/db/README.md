# DB Layer (SQLite + Drizzle)

> Static-stack: один файл `data/scouting.db`, коммитится в git, читается на Vercel
> при `next build`. Заполняется локально Python-сборщиком из `../nkcelje-scout/`.

## Структура

```
nkcelje/
├── data/
│   └── scouting.db          ← коммитится в git (источник правды для Vercel)
└── src/db/
    ├── schema.ts            ← Drizzle-схема (источник правды для миграций)
    ├── client.ts            ← better-sqlite3 + Drizzle клиент
    ├── queries.ts           ← готовые запросы (getTeam, getPlayer, ...)
    ├── migrate.ts           ← применить миграции к data/scouting.db
    ├── check.ts             ← smoke-test чтения
    └── migrations/          ← *.sql файлы, генерируются drizzle-kit
```

## Команды

```bash
# Сгенерировать миграцию после изменения схемы
npm run db:generate

# Применить миграции к data/scouting.db
npm run db:migrate

# Открыть Drizzle Studio (UI для просмотра БД)
npm run db:studio

# Проверить, что чтение работает
npx tsx src/db/check.ts
```

## Использование в коде

```ts
// В Server Components / API routes
import { getPlayer, getTeamRoster } from "@/db/queries";

export default async function CeljePage() {
  const roster = getTeamRoster(2413); // NK Celje
  return <ul>{roster.map((p) => <li key={p.playerId}>{p.name}</li>)}</ul>;
}
```

⚠ `better-sqlite3` — нативный модуль, работает **только на server-side**. Не
импортируй `@/db/*` из `'use client'` компонентов.

## Vercel deploy

1. В Vercel project settings: **Root Directory = `nkcelje`**
2. Build command — дефолт (`next build`)
3. Vercel клонирует репо целиком, файл `nkcelje/data/scouting.db` едет в билд
4. На этапе билда страницы (отмеченные как статические) читают БД и зашиваются
   в HTML
5. Деплоится статика; serverless-функции БД не трогают

## Обновление данных в продакшене

```bash
cd ../nkcelje-scout
.venv/bin/python scripts/collect_celje.py    # дозаполняет data/scouting.db

cd ../nkcelje
git add data/scouting.db
git commit -m "data: refresh NK Celje snapshot"
git push                                       # Vercel задеплоит обновлённую БД
```
