import { describe, it, expect } from 'vitest'
import { csvEscape, parseCsvRows } from './csv'

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

describe('parseCsvRows', () => {
  it('parses plain rows', () => {
    expect(parseCsvRows('Name,Latitude,Longitude\nSite A,10,20')).toEqual([
      ['Name', 'Latitude', 'Longitude'],
      ['Site A', '10', '20'],
    ])
  })

  it('keeps quoted commas inside the field', () => {
    expect(parseCsvRows('Name,Address\n"North, Gate","12 Main, Suite 4"')).toEqual([
      ['Name', 'Address'],
      ['North, Gate', '12 Main, Suite 4'],
    ])
  })

  it('unescapes quoted double quotes', () => {
    expect(parseCsvRows('Name\n"Site ""Alpha"""')).toEqual([
      ['Name'],
      ['Site "Alpha"'],
    ])
  })

  it('handles CRLF rows', () => {
    expect(parseCsvRows('Name,Latitude\r\nSite A,10\r\n')).toEqual([
      ['Name', 'Latitude'],
      ['Site A', '10'],
    ])
  })

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsvRows('Name,Notes\nSite A,"line 1\nline 2"')).toEqual([
      ['Name', 'Notes'],
      ['Site A', 'line 1\nline 2'],
    ])
  })
})
