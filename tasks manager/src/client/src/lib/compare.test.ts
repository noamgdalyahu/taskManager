import { describe, expect, it } from 'vitest'
import { comparisonSummary, improvementPercent } from './compare'

describe('improvementPercent', () => {
  it('is the drop relative to the baseline', () => {
    expect(improvementPercent(20, 15)).toBe(25)
  })
  it('is 0 when not better or when the baseline is zero', () => {
    expect(improvementPercent(10, 12)).toBe(0)
    expect(improvementPercent(0, 0)).toBe(0)
  })
})

describe('comparisonSummary', () => {
  it('describes the gain over manual and greedy', () => {
    const text = comparisonSummary([
      { name: 'Manual', objective: 20 },
      { name: 'Greedy', objective: 16 },
      { name: 'Hungarian', objective: 15 },
    ])
    expect(text).toBe('Hungarian scores 25.0% better than your assignment and 6.3% better than the greedy baseline.')
  })
  it('is null without a Hungarian score', () => {
    expect(comparisonSummary([{ name: 'Manual', objective: 1 }])).toBeNull()
  })
})
