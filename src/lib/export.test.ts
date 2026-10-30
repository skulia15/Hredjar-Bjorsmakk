import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getExportContentType, getExportFilename } from './export'

describe('getExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-20T18:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('slugifies the title and appends date and extension', () => {
    expect(getExportFilename('Christmas Tasting #3!', 'xlsx')).toBe('christmas-tasting-3-2026-12-20.xlsx')
  })

  it('transliterates Icelandic letters instead of dropping them', () => {
    expect(getExportFilename('Hreðjar Bjórsmakk', 'csv')).toBe('hredjar-bjorsmakk-2026-12-20.csv')
    expect(getExportFilename('Þorláksmessa æði', 'csv')).toBe('thorlaksmessa-aedi-2026-12-20.csv')
    expect(getExportFilename('Bjórsmökkun', 'csv')).toBe('bjorsmokkun-2026-12-20.csv')
  })
})

describe('getExportContentType', () => {
  it('maps formats to MIME types', () => {
    expect(getExportContentType('csv')).toBe('text/csv')
    expect(getExportContentType('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })
})
