import { syncCatalogFromBtcMap } from "../src/infrastructure/btc-map.ts";
import { catalogCount } from "../src/infrastructure/catalog.ts";

const added = await syncCatalogFromBtcMap();
console.log(
  `[catalog] sync +${added.addedShops} shops +${added.addedComms} communities (total ${catalogCount()})`,
);
