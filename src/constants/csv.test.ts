import { describe, it, expect } from 'vitest'
import { csvEscape } from './csv'

describe('csvEscape', () => {
  it('returns plain strings unchanged', () => {
    expect(csvEscape('hello')).toBe('hello')
    expect(csvEscape('hello world')).toBe('hello world')
  })

  it('escapes strings containing commas', () => {
    expect(csvEscape('hello,world')).toBe('"hello,world"')
  })

  it('escapes strings containing double quotes', () => {
    expect(csvEscape('say "hello"')).toBe('"say ""hello"""')
  })

  it('escapes strings containing newlines', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"')
  })

  it('escapes strings with multiple special characters', () => {
    expect(csvEscape('a,b\n"c"')).toBe('"a,b\n""c"""')
  })

  it('handles empty string', () => {
    expect(csvEscape('')).toBe('')
  })

  it('handles string with only a comma', () => {
    expect(csvEscape(',')).toBe('","')
  })
})
