// Apply migrations to data/scouting.db. Run with: npx tsx src/db/migrate.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "./data/scouting.db");
const MIGRATIONS_FOLDER = path.resolve(process.cwd(), "./src/db/migrations");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

console.log(`Applying migrations from ${MIGRATIONS_FOLDER} to ${DB_PATH}`);
migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
console.log("Migrations applied.");

sqlite.close();
