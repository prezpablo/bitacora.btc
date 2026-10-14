function addScore(score: number, votes: number, stars: number) {
  const n = Math.max(0, Math.floor(votes) || 0);
  const prev = n === 0 ? 0 : Number(score) || 0;
  const next = n + 1;
  return { score: (prev * n + stars) / next, votes: next };
}

/** Solo cuenta si el promedio que llega es el de sumar una estrella (1 a 5). */
export function publicVoteTally(prevScore: number, prevVotes: number, nextScore: number, nextVotes: number) {
  const prevN = Math.max(0, Math.floor(prevVotes) || 0);
  if (Math.floor(Number(nextVotes)) !== prevN + 1) return null;
  const raw = Number(nextScore);
  if (!Number.isFinite(raw) || raw < 1 || raw > 5) return null;
  for (let star = 1; star <= 5; star++) {
    const tally = addScore(prevScore, prevN, star);
    if (Math.abs(tally.score - raw) <= 0.0002) return tally;
  }
  return null;
}

type VoteRow = { id: string; score: number; votes: number };

/** Un id, un voto. `skipRest` conserva el corte de antes: un salto de más de un voto no toca la fila. */
export function takePublicVote(prev: VoteRow, incoming: VoteRow, voted: Set<string>, bumps: number) {
  const nextVotes = Math.max(0, Math.floor(Number(incoming.votes) || 0));
  if (nextVotes > (prev.votes || 0) + 1) return { bumps, skipRest: true };
  if (nextVotes !== (prev.votes || 0) + 1) return { bumps, skipRest: false };
  if (voted.has(prev.id)) return { bumps, skipRest: false };
  if (bumps >= 3) return { bumps, skipRest: true };
  voted.add(prev.id);
  const tally = publicVoteTally(prev.score, prev.votes, incoming.score, nextVotes);
  if (!tally) return { bumps, skipRest: false };
  prev.votes = tally.votes;
  prev.score = tally.score;
  return { bumps: bumps + 1, skipRest: false };
}
