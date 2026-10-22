import assert from "node:assert/strict";
import { test } from "node:test";
import { QUIZ_BANK, QUIZ_POSTERS, answerIsRight, drawQuiz, quizPassed, tallyDigits } from "./learn-quiz.ts";

test("learn quiz bank is answerable", () => {
  assert.equal(QUIZ_BANK.length, 21);
  assert.equal(QUIZ_POSTERS.length, 21);
  assert.equal(QUIZ_POSTERS[0], "/repaso/v/01.jpg");
  assert.equal(QUIZ_POSTERS[20], "/repaso/v/21.jpg");
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

test("retro tally pads without cutting a bigger count", () => {
  assert.equal(tallyDigits(0), "000000");
  assert.equal(tallyDigits(7), "000007");
  assert.equal(tallyDigits(1234567), "1234567");
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
