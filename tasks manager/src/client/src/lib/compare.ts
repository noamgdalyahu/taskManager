/** How much lower (better) `candidate` scored than `baseline`, as a percentage of the baseline. 0 when there is nothing to improve on. */
export function improvementPercent(baseline: number, candidate: number): number {
  if (baseline <= 0 || candidate >= baseline) return 0
  return ((baseline - candidate) / baseline) * 100
}

/** One sentence on what the optimiser gained over the other approaches, or null when it was not scored. */
export function comparisonSummary(scores: { name: string; objective: number }[]): string | null {
  const byName = new Map(scores.map((s) => [s.name, s.objective]))
  const hungarian = byName.get('Hungarian')
  if (hungarian === undefined) return null
  const parts: string[] = []
  const manual = byName.get('Manual')
  const greedy = byName.get('Greedy')
  if (manual !== undefined) parts.push(`${improvementPercent(manual, hungarian).toFixed(1)}% better than your assignment`)
  if (greedy !== undefined) parts.push(`${improvementPercent(greedy, hungarian).toFixed(1)}% better than the greedy baseline`)
  return parts.length ? `Hungarian scores ${parts.join(' and ')}.` : null
}
