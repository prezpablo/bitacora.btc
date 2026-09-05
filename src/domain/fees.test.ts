import assert from "node:assert/strict";
import { test } from "node:test";
import { feesFromBitcoiner, feesFromEsplora, feesFromMempool, mergeLiveFees } from "./fees.ts";

test("feesFromMempool maps fastest/hour", () => {
  assert.deepEqual(feesFromMempool({ fastestFee: 12.4, hourFee: 3.1 }), { feeFast: 12, feeHour: 3 });
  assert.deepEqual(feesFromMempool({}), {});
});

test("feesFromEsplora uses block targets", () => {
  assert.deepEqual(feesFromEsplora({ "1": 14.2, "6": 4.8 }), { feeFast: 14, feeHour: 5 });
});

test("feesFromBitcoiner uses 30m / 60m sat_per_vbyte", () => {
  const q = feesFromBitcoiner({
    estimates: { "30": { sat_per_vbyte: 8.6 }, "60": { sat_per_vbyte: 2.2 } },
  });
  assert.deepEqual(q, { feeFast: 9, feeHour: 2 });
});

test("mergeLiveFees keeps last quote when mempool times out", () => {
  const live = { height: 900_000, feeFast: undefined as number | undefined };
  const last = { feeFast: 7, feeHour: 2 };
  const out = mergeLiveFees(live, last);
  assert.equal(out.feeFast, 7);
  assert.equal(out.feeStale, true);
  assert.equal(out.height, 900_000);
  const fresh = mergeLiveFees({ height: 1, feeFast: 11, feeHour: 4 }, last);
  assert.equal(fresh.feeFast, 11);
  assert.equal(fresh.feeStale, false);
});
