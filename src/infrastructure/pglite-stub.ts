/** PGLite apagado: Bitácora usa SQLite. Auth off no abre WASM de Postgres. */

export class PGlite {
  waitReady = Promise.resolve();
  exec() {
    return Promise.resolve();
  }
  query() {
    return Promise.resolve({ rows: [] as { name: string }[] });
  }
  transaction<T>(fn: (tx: PGlite) => Promise<T>) {
    return fn(this);
  }
}

export default { PGlite };
