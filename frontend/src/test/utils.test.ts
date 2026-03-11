import { describe, it, expect } from 'vitest'
import { formatCurrency, getPricing } from '@/utils'

describe('formatCurrency', () => {
  it('formats Indian Rupee correctly', () => {
    expect(formatCurrency(1300)).toContain('1,300')
  })
})

describe('getPricing', () => {
  it('returns correct pricing for 2by1 6m self_saree', () => {
    const p = getPricing('2by1', '6m', 'self_saree')
    expect(p.selling).toBe(1300)
    expect(p.expense).toBe(900)
    expect(p.profit).toBe(400)
    expect(p.wage).toBe(250)
  })

  it('returns correct pricing for 2by1 9m gothila', () => {
    const p = getPricing('2by1', '9m', 'gothila')
    expect(p.selling).toBe(1800)
    expect(p.wage).toBe(350)
  })

  it('returns zeros for unknown type', () => {
    const p = getPricing('unknown', 'unknown', 'unknown')
    expect(p.selling).toBe(0)
  })
})
