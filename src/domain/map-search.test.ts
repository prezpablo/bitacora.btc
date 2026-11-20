import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { foldLatin, likeNeedle, matchesQuery, sqlFold } from "./map-search.ts";

test("la búsqueda pliega acentos y pega en nombre, ciudad o rubro", () => {
  assert.equal(matchesQuery("satoshi", "Satoshilemu", "Pichilemu, Chile"), true);
  assert.equal(matchesQuery("pichilemu", "Satoshilemu", "Pichilemu, Chile"), true);
  assert.equal(matchesQuery("bogota", "Bogotá"), true);
  assert.equal(matchesQuery("minisuper", "2", "minisuper"), true);
  assert.equal(matchesQuery("colonia", "Consciencia Bitcoin", "consciencia-bitcoin", "Colonia del Sacramento"), true);
  assert.equal(matchesQuery("", "Satoshilemu"), false);
  assert.equal(matchesQuery("zzz", "Satoshilemu", "Pichilemu"), false);
});

test("el LIKE del catálogo encuentra comercio y comunidad sin el acento", () => {
  const req = createRequire(import.meta.url);
  const { DatabaseSync } = req("node:sqlite") as { DatabaseSync: new (p: string) => { exec: (s: string) => void; prepare: (s: string) => { run: (...a: string[]) => unknown; all: (...a: string[]) => { name: string }[] } } };
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE catalog (tipo TEXT, name TEXT, category TEXT, description TEXT)");
  const ins = db.prepare("INSERT INTO catalog VALUES (?,?,?,?)");
  ins.run("shop", "Café Bitcoin", "cafetería", "");
  ins.run("community", "Consciencia Bitcoin", "consciencia-bitcoin", "Colonia del Sacramento");
  ins.run("shop", "Bouriks", "hamburguesería", "Calle 57, La Plata");
  const name = sqlFold("name");
  const cat = sqlFold("category");
  const desc = sqlFold("description");
  const sql = `SELECT name FROM catalog WHERE tipo = ? AND (${name} LIKE ? OR ${cat} LIKE ? OR ${desc} LIKE ?)`;
  const cafe = likeNeedle("cafe");
  assert.equal(db.prepare(sql).all("shop", cafe, cafe, cafe).length, 1);
  const plata = likeNeedle("la plata");
  assert.equal(db.prepare(sql).all("shop", plata, plata, plata)[0]?.name, "Bouriks");
  const col = likeNeedle("colonia");
  assert.equal(db.prepare(sql).all("community", col, col, col)[0]?.name, "Consciencia Bitcoin");
  assert.equal(likeNeedle("a"), "");
  assert.equal(foldLatin("São Paulo"), "sao paulo");
});
