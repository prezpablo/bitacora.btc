import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicHttp, pinnedLookup } from "./safe-fetch.ts";

test("scraper does not follow loopback or the VPS itself", () => {
  assert.equal(isPublicHttp("http://127.0.0.1:8080/admin"), false);
  assert.equal(isPublicHttp("http://169.254.169.254/latest/meta-data"), false);
  assert.equal(isPublicHttp("https://localhost/x"), false);
  assert.equal(isPublicHttp("https://45.158.116.49.nip.io/healthz"), false);
  assert.equal(isPublicHttp("https://bitacorabtc.org/"), false);
  assert.equal(isPublicHttp("https://x.com/consciencia"), true);
  assert.equal(isPublicHttp("javascript:alert(1)"), false);
  assert.equal(isPublicHttp("http://x.com/consciencia"), false);
  assert.equal(isPublicHttp("file:///etc/passwd"), false);
  assert.equal(isPublicHttp("gopher://127.0.0.1:70/"), false);
});

test("S-REBIND the socket lookup returns the address already checked", () => {
  const lookup = pinnedLookup("1.1.1.1", 4);
  lookup("rebind.test", {}, (err, address, family) => {
    assert.equal(err, null);
    assert.equal(address, "1.1.1.1");
    assert.equal(family, 4);
  });
  lookup("rebind.test", { all: true }, (err, rows) => {
    assert.equal(err, null);
    assert.deepEqual(rows, [{ address: "1.1.1.1", family: 4 }]);
  });
});
