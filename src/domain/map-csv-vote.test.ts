import assert from "node:assert/strict";
import { test } from "node:test";
import { publicVoteTally, takePublicVote } from "./public-vote.ts";

test("S-VOTE repetir el id no suma tres votos ni pisa el promedio", () => {
  const prev = { id: "btcmap:1", score: 1, votes: 2 };
  const voted = new Set<string>();
  let bumps = 0;
  const attack = { id: prev.id, score: 5, votes: 3 };
  for (let i = 0; i < 3; i++) {
    const step = takePublicVote(prev, attack, voted, bumps);
    bumps = step.bumps;
    assert.equal(step.skipRest, false);
  }
  assert.equal(prev.votes, 2);
  assert.equal(prev.score, 1);
  assert.equal(bumps, 0);

  const honestScore = (1 * 2 + 5) / 3;
  const ok = takePublicVote(prev, { id: prev.id, score: honestScore, votes: 3 }, new Set(), 0);
  assert.equal(ok.bumps, 1);
  assert.equal(prev.votes, 3);
  assert.ok(Math.abs(prev.score - honestScore) < 0.0002);

  const again = takePublicVote(prev, { id: prev.id, score: 5, votes: 4 }, voted, bumps);
  assert.equal(again.bumps, bumps);
  assert.equal(prev.votes, 3);
});

test("S-VOTE un 5 suelto no reemplaza diez votos de 1", () => {
  assert.equal(publicVoteTally(1, 10, 5, 11), null);
  const tally = publicVoteTally(1, 10, (1 * 10 + 5) / 11, 11);
  assert.equal(tally?.votes, 11);
  assert.ok(tally && tally.score < 2);
});
