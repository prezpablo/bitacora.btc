import { catalogCount, ensureCatalog } from "../src/infrastructure/catalog.ts";

ensureCatalog();
console.log(`[catalog] ${catalogCount()} rows in Bitácora sqlite`);
