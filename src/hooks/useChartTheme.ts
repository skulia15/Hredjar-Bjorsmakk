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
  return chartTheme
}

const chartTheme: ChartTheme = {
  primary: '#C8323A',
  secondary: '#F2A93B',
  success: '#1E6B4F',
  warning: '#F2A93B',
  danger: '#C8323A',
  axis: '#5E574A',
  grid: 'rgba(30,27,22,0.12)',
  pieColors: ['#C8323A', '#1E6B4F', '#F2A93B', '#7A3B12', '#8FC1A9', '#E08A5B', '#2F6150', '#D9D3C4', '#9E2A31', '#C9A227'],
  barCornerRadius: 8,
}
