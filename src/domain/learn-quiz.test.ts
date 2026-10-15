import assert from "node:assert/strict";
import { test } from "node:test";
import { QUIZ_BANK, QUIZ_POSTERS, answerIsRight, drawQuiz, quizPassed } from "./learn-quiz.ts";

test("learn quiz bank is answerable", () => {
  assert.ok(QUIZ_BANK.length > 5);
  assert.equal(QUIZ_POSTERS.length, 10);
  for (const q of QUIZ_BANK) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((item) => item.correct));
    assert.equal(q.options.filter((item) => item.correct).length > 1, q.multi);
  }
});

test("draw returns five shuffled questions", () => {
  let n = 0;
  const rand = () => {
    n += 1;
    return (n % 7) / 7;
  };
  const round = drawQuiz(QUIZ_BANK, 5, rand);
  assert.equal(round.length, 5);
  assert.equal(new Set(round.map((q) => q.id)).size, 5);
});

test("a pass needs more than half", () => {
  assert.equal(quizPassed(2, 5), false);
  assert.equal(quizPassed(3, 5), true);
  const multi = QUIZ_BANK.find((q) => q.id === "flags");
  assert.ok(multi);
  assert.equal(answerIsRight(multi, ["daily", "withdraw"]), true);
  assert.equal(answerIsRight(multi, ["daily"]), false);
  assert.equal(answerIsRight(multi, ["daily", "withdraw", "try"]), false);
});
