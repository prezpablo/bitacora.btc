import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

function fileHit(abs) {
  const cands = /\.(ts|tsx|mts|js|mjs|cjs|json|node)$/.test(abs)
    ? [abs]
    : [abs + ".ts", abs + ".tsx", abs + ".mts", abs + ".js", abs + ".mjs", join(abs, "index.ts"), join(abs, "index.js")];
  for (const c of cands) {
    try {
      if (existsSync(c) && statSync(c).isFile()) return pathToFileURL(c).href;
    } catch {
      /* next */
    }
  }
  return "";
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const hit = fileHit(join(SRC, specifier.slice(2)));
    if (hit) return nextResolve(hit, context);
  } else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    (context.parentURL || "").endsWith(".ts")
  ) {
    const hit = fileHit(join(dirname(fileURLToPath(context.parentURL)), specifier));
    if (hit) return nextResolve(hit, context);
  }
  return nextResolve(specifier, context);
}
