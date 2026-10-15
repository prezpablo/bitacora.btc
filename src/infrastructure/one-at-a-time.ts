let tail: Promise<unknown> = Promise.resolve();

/** Una sola tarea a la vez. La siguiente espera a que la anterior termine, también si falló. */
export function oneAtATime<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
