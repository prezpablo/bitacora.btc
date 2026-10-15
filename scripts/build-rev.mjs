/** First 7 hex digits, or "" when the value is not a commit. */
export function shortRev(value) {
  const match = String(value ?? "")
    .trim()
    .toLowerCase()
    .match(/[0-9a-f]{7,40}/);
  return match ? match[0].slice(0, 7) : "";
}

/** Hash already written into src/build-rev.ts (GitHub zip via export-subst). */
export function stampedRev(code) {
  const match = String(code ?? "").match(/BUILD_REV\s*=\s*["']([0-9a-f]{7,40})["']/i);
  return match ? match[1] : "";
}

/**
 * What the footer may show. The file stamp wins: it is the commit inside the
 * ZIP. SOURCE_REV and git are fallbacks for a tree that was not archived.
 */
export function pickBuildRev({ env = "", git = "", stamped = "" } = {}) {
  return shortRev(stamped) || shortRev(env) || shortRev(git);
}
