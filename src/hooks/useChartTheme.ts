'use client'

import { useEffect, useState } from 'react'

export interface ChartTheme {
  primary: string
  secondary: string
  success: string
  warning: string
  danger: string
  axis: string
  grid: string
  pieColors: string[]
  barCornerRadius: number
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(() => baseDefaultTheme)

  useEffect(() => {
    const compute = () => {
      const body = document.body
      if (body.classList.contains('christmas')) return setTheme(baseChristmasTheme)
      if (body.classList.contains('neo-brutalist')) return setTheme(baseNeoTheme)
      setTheme(baseDefaultTheme)
    }
    compute()
    const observer = new MutationObserver(compute)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return theme
}

const baseDefaultTheme: ChartTheme = {
  primary: '#3b82f6',
  secondary: '#94a3b8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  axis: '#64748b',
  grid: '#cbd5e1',
  pieColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'],
  barCornerRadius: 4,
}

const baseNeoTheme: ChartTheme = {
  primary: '#111111',
  secondary: '#ff006e',
  success: '#111111',
  warning: '#ff7a00',
  danger: '#ef233c',
  axis: '#000000',
  grid: 'rgba(0,0,0,0.25)',
  pieColors: ['#111111', '#FFD400', '#ff006e', '#00e5ff', '#b8ff00', '#ff7a00', '#7c3aed', '#14b8a6', '#ef233c', '#3b82f6'],
  barCornerRadius: 0,
}

const baseChristmasTheme: ChartTheme = {
  primary: '#d90429',
  secondary: '#ffd166',
  success: '#06d6a0',
  warning: '#ffd166',
  danger: '#ef233c',
  axis: '#2f2f2f',
  grid: 'rgba(0,0,0,0.18)',
  pieColors: ['#d90429', '#06d6a0', '#ffd166', '#118ab2', '#ef233c', '#73d2de', '#d9ed92', '#90be6d', '#f28482', '#ffafcc'],
  barCornerRadius: 8,
}


