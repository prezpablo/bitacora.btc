/** Acentos que SQLite no pliega con lower(). El cliente usa foldLatin. */
const FOLD_FROM = ["á", "é", "í", "ó", "ú", "à", "è", "ì", "ò", "ù", "ä", "ë", "ï", "ö", "ü", "â", "ê", "î", "ô", "û", "ã", "õ", "ñ", "ç"] as const;
const FOLD_TO = ["a", "e", "i", "o", "u", "a", "e", "i", "o", "u", "a", "e", "i", "o", "u", "a", "e", "i", "o", "u", "a", "o", "n", "c"] as const;

export function foldLatin(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchesQuery(q: string, ...fields: string[]) {
  const n = foldLatin(q.trim());
  if (!n) return false;
  return fields.some((f) => f && foldLatin(f).includes(n));
}

/** Expresión SQL equivalente a foldLatin, para LIKE. */
export function sqlFold(col: string) {
  let expr = col;
  for (let i = 0; i < FOLD_FROM.length; i++) {
    const from = FOLD_FROM[i]!;
    const to = FOLD_TO[i]!;
    expr = `replace(${expr}, '${from}', '${to}')`;
    expr = `replace(${expr}, '${from.toUpperCase()}', '${to}')`;
  }
  return `lower(${expr})`;
}

export function likeNeedle(raw: string) {
  const folded = foldLatin(raw).replace(/[%_\\]/g, "");
  if (folded.length < 2) return "";
  return `%${folded}%`;
}
