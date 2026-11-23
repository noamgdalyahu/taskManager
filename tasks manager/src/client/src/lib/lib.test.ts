import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'
import { formatHours, initials, percent, remainingHours, shortId } from './format'
import { addDays, daysBetween } from './sprintDays'

describe('csv', () => {
  it('quotes every cell and escapes quotes', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'say "hi"'], [1, 2]])).toBe('"a","b"\r\n"x,y","say ""hi"""\r\n"1","2"')
  })
})

describe('format', () => {
  it('rounds hours to one decimal', () => {
    expect(formatHours(8)).toBe('8 h')
    expect(formatHours(7.5)).toBe('7.5 h')
    expect(formatHours(0.3333)).toBe('0.3 h')
  })
  it('clamps percent between 0 and 100', () => {
    expect(percent(5, 10)).toBe(50)
    expect(percent(20, 10)).toBe(100)
    expect(percent(-1, 10)).toBe(0)
    expect(percent(3, 0)).toBe(0)
  })
  it('builds initials', () => {
    expect(initials('noa levi')).toBe('NL')
    expect(initials('Avi')).toBe('A')
    expect(initials('  ')).toBe('?')
  })
  it('shortens ids', () => {
    expect(shortId('1a2b3c4d')).toBe('1A2B')
  })
  it('counts nothing remaining for done tasks', () => {
    expect(remainingHours({ status: 'Done', estimateHours: 5 })).toBe(0)
    expect(remainingHours({ status: 'ToDo', estimateHours: 5 })).toBe(5)
  })
})

describe('sprintDays', () => {
  it('counts days between dates, signed', () => {
    expect(daysBetween('2026-11-01', '2026-11-13')).toBe(12)
    expect(daysBetween('2026-11-13', '2026-11-01')).toBe(-12)
  })
  it('adds days across month ends', () => {
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02')
  })
})
