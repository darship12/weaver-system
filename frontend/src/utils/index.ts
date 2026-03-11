import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export const formatDate = (dateStr: string) => {
  try { return format(parseISO(dateStr), 'dd MMM yyyy') } catch { return dateStr }
}

export const formatShortDate = (dateStr: string) => {
  try { return format(parseISO(dateStr), 'dd/MM') } catch { return dateStr }
}

export const SAREE_PRICING: Record<string, { selling: number; expense: number; profit: number; wage: number }> = {
  '2by1_6m_self_saree': { selling: 1300, expense: 900, profit: 400, wage: 250 },
  '2by1_6m_kadiyal':    { selling: 1300, expense: 900, profit: 400, wage: 250 },
  '2by1_9m_gothila':    { selling: 1800, expense: 1000, profit: 800, wage: 350 },
  '4by1_6m_self_saree': { selling: 1650, expense: 1000, profit: 650, wage: 0 },
  '4by1_6m_kadiyal':    { selling: 1650, expense: 1000, profit: 650, wage: 0 },
  '4by1_9m_self_saree': { selling: 2200, expense: 1200, profit: 1000, wage: 0 },
  '4by1_9m_kadiyal':    { selling: 2200, expense: 1200, profit: 1000, wage: 0 },
}

export const getPricing = (loomType: string, length: string, sareeType: string) =>
  SAREE_PRICING[`${loomType}_${length}_${sareeType}`] || { selling: 0, expense: 0, profit: 0, wage: 0 }

export const LOOM_TYPES = [{ value: '2by1', label: '2 by 1' }, { value: '4by1', label: '4 by 1' }]
export const SAREE_LENGTHS = [{ value: '6m', label: '6 Meter' }, { value: '9m', label: '9 Meter' }]
export const SAREE_TYPES = [{ value: 'self_saree', label: 'Self Saree' }, { value: 'kadiyal', label: 'Kadiyal' }, { value: 'gothila', label: 'Gothila' }]
export const DESIGN_TYPES = ['Butha', 'Mysore Silk', 'Checks', 'Stripes', 'Floral', 'Border Work', 'Zari Work', 'Other'].map(v => ({ value: v.toLowerCase().replace(' ','_'), label: v }))
export const SKILL_LEVELS = [{ value: 'trainee', label: 'Trainee' }, { value: 'junior', label: 'Junior' }, { value: 'senior', label: 'Senior' }, { value: 'master', label: 'Master' }]
