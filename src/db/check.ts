// Smoke test: read from data/scouting.db. Run: npx tsx src/db/check.ts
import { dbHealth } from "./queries";

const counts = dbHealth();
console.log("Row counts per table:");
for (const [name, n] of Object.entries(counts).sort()) {
  console.log(`  ${name.padEnd(35)} ${n}`);
}
