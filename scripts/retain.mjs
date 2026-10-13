import { purgeRetention } from "../src/infrastructure/retention.ts";

const n = purgeRetention();
console.log(`[retain] ${JSON.stringify(n)}`);
