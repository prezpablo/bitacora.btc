import { useEffect, useState } from "react";
import {
  QUIZ_BANK,
  QUIZ_POSTERS,
  answerIsRight,
  drawQuiz,
  quizPassed,
  quizText,
  type QuizQuestion,
} from "@/domain/learn-quiz";
import { useAppLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const COPY = {
  es: {
    title: "Repaso",
    lead: "Cinco preguntas de lo que ya leíste en Aprender. Salen al azar.",
    one: "Marcá una.",
    many: "Marcá todas las que correspondan.",
    check: "Verificar",
    next: "Siguiente",
    result: "Ver resultado",
    again: "Otra vez",
    progress: "Pregunta {n} de {total}",
    score: "{n} de {total}",
    right: "Correcto.",
    wrong: "No es esa. La respuesta correcta queda marcada.",
    pass: "Más de la mitad. Esta imagen es tuya.",
    fail: "Menos de la mitad. Volvé a leer Aprender y probá de nuevo.",
    download: "Descargar",
    poster: "Imagen ciberpunk del repaso",
  },
  en: {
    title: "Review",
    lead: "Five questions from what you already read in Learn. They come up at random.",
    one: "Pick one.",
    many: "Pick every one that fits.",
    check: "Check",
    next: "Next",
    result: "See result",
    again: "Again",
    progress: "Question {n} of {total}",
    score: "{n} of {total}",
    right: "Correct.",
    wrong: "Not that one. The right answer is marked.",
    pass: "More than half. This image is yours.",
    fail: "Less than half. Read Learn again and try once more.",
    download: "Download",
    poster: "Cyberpunk image from the review",
  },
  pt: {
    title: "Revisão",
    lead: "Cinco perguntas do que você já leu em Aprender. Saem ao acaso.",
    one: "Marque uma.",
    many: "Marque todas as que couberem.",
    check: "Verificar",
    next: "Seguinte",
    result: "Ver resultado",
    again: "Outra vez",
    progress: "Pergunta {n} de {total}",
    score: "{n} de {total}",
    right: "Certo.",
    wrong: "Não é essa. A resposta certa fica marcada.",
    pass: "Mais da metade. Esta imagem é sua.",
    fail: "Menos da metade. Leia Aprender de novo e tente outra vez.",
    download: "Baixar",
    poster: "Imagem cyberpunk da revisão",
  },
} as const;

const TOTAL = 5;

function fill(text: string, n: number, total: number) {
  return text.replace("{n}", String(n)).replace("{total}", String(total));
}

export function LearnQuiz() {
  const lang = useAppLang();
  const t = COPY[lang];
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [poster, setPoster] = useState(QUIZ_POSTERS[0]);

  useEffect(() => {
    setQuestions(drawQuiz(QUIZ_BANK, TOTAL));
    setIndex(0);
    setPicked([]);
    setChecked(false);
    setScore(0);
    setDone(false);
  }, [round]);

  const question = questions?.[index];
  const passed = quizPassed(score, TOTAL);
  const progress = done ? 100 : Math.round(((index + (checked ? 1 : 0)) / TOTAL) * 100);

  const toggle = (id: string) => {
    if (!question || checked) return;
    setPicked((prev) => {
      if (!question.multi) return [id];
      return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const verify = () => {
    if (!question || checked || picked.length === 0) return;
    if (answerIsRight(question, picked)) setScore((n) => n + 1);
    setChecked(true);
  };

  const forward = () => {
    if (!checked) return;
    if (index + 1 >= TOTAL) {
      setPoster(QUIZ_POSTERS[Math.floor(Math.random() * QUIZ_POSTERS.length)] ?? QUIZ_POSTERS[0]);
      setDone(true);
      return;
    }
    setIndex((n) => n + 1);
    setPicked([]);
    setChecked(false);
  };

  return (
    <section id="repaso" className="scroll-mt-[4.5rem] space-y-3 rounded-lg bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">{t.title}</h2>
        <p className="mt-1 max-w-2xl text-base text-pretty text-muted-foreground">{t.lead}</p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={done ? fill(t.score, score, TOTAL) : fill(t.progress, index + 1, TOTAL)}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      {!question ? <p className="text-sm text-muted-foreground">{t.lead}</p> : null}
      {question && !done ? (
        <div>
          <p className="font-mono text-xs text-muted-foreground">{fill(t.progress, index + 1, TOTAL)}</p>
          <p className="mt-2 text-base font-medium text-pretty text-foreground">{quizText(question, lang)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{question.multi ? t.many : t.one}</p>
          <div role="group" className="mt-3 space-y-2">
            {question.options.map((item) => {
              const on = picked.includes(item.id);
              const show = checked && item.correct;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  disabled={checked}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex w-full rounded-md bg-background px-3 py-2.5 text-left text-sm text-pretty text-foreground shadow-[0_0_0_1px_#e6e6e6] disabled:cursor-default",
                    on && !checked && "shadow-[0_0_0_1px_#f7931a]",
                    show && "shadow-[0_0_0_1px_#f7931a]",
                    checked && on && !item.correct && "text-muted-foreground line-through",
                  )}
                >
                  {quizText(item, lang)}
                </button>
              );
            })}
          </div>
          {checked ? <p className="mt-3 text-sm text-foreground">{answerIsRight(question, picked) ? t.right : t.wrong}</p> : null}
          <div className="mt-3 flex gap-2">
            {!checked ? (
              <button
                type="button"
                disabled={picked.length === 0}
                onClick={verify}
                className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {t.check}
              </button>
            ) : (
              <button type="button" onClick={forward} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-white">
                {index + 1 >= TOTAL ? t.result : t.next}
              </button>
            )}
          </div>
        </div>
      ) : null}
      {done ? (
        <div className="space-y-3">
          <p className="text-base font-medium text-foreground">{fill(t.score, score, TOTAL)}</p>
          <p className="text-sm text-pretty text-muted-foreground">{passed ? t.pass : t.fail}</p>
          {passed ? (
            <figure className="space-y-2">
              <img src={poster} alt={t.poster} className="w-full rounded-md" />
              <a
                href={poster}
                download="bitacora-repaso.jpg"
                className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-white no-underline"
              >
                {t.download}
              </a>
            </figure>
          ) : null}
          <button type="button" onClick={() => setRound((n) => n + 1)} className="h-9 rounded-md bg-card px-3 text-sm font-medium text-foreground shadow-[0_0_0_1px_#e6e6e6]">
            {t.again}
          </button>
        </div>
      ) : null}
    </section>
  );
}

