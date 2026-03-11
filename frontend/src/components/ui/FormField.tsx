import React from 'react'
import { cn } from '@/utils'

interface Props {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}

export const FormField: React.FC<Props> = ({ label, error, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="label">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
    {error && <p className="text-xs text-red-400 flex items-center gap-1"><span>⚠</span> {error}</p>}
  </div>
)

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({ options, placeholder, className, ...props }) => (
  <select className={cn('input', className)} {...props}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)
