import { describe, it, expect } from 'vitest'
import { roleColors, severityColors } from './ui'

describe('ui constants', () => {
  describe('roleColors', () => {
    it('contains all four role keys', () => {
      expect(roleColors).toHaveProperty('superadmin')
      expect(roleColors).toHaveProperty('admin')
      expect(roleColors).toHaveProperty('analyst')
      expect(roleColors).toHaveProperty('operator')
    })

    it('has non-empty Tailwind class strings', () => {
      Object.values(roleColors).forEach((classes) => {
        expect(classes.length).toBeGreaterThan(0)
        expect(classes).toContain('text-')
        expect(classes).toContain('bg-')
      })
    })

    it('each role has unique color', () => {
      const colors = Object.values(roleColors).map((c) => {
        const match = c.match(/text-(\w+)-\d+/)?.[1]
        return match
      })
      const unique = new Set(colors)
      expect(unique.size).toBe(colors.length)
    })
  })

  describe('severityColors', () => {
    it('contains all four severity keys', () => {
      expect(severityColors).toHaveProperty('critical')
      expect(severityColors).toHaveProperty('high')
      expect(severityColors).toHaveProperty('medium')
      expect(severityColors).toHaveProperty('low')
    })

    it('has non-empty Tailwind class strings', () => {
      Object.values(severityColors).forEach((classes) => {
        expect(classes.length).toBeGreaterThan(0)
        expect(classes).toContain('text-')
        expect(classes).toContain('bg-')
      })
    })
  })
})
