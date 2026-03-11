import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/utils'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'brand' | 'green' | 'blue' | 'purple' | 'red'
  index?: number
}

const COLORS = {
  brand:  { bg: 'bg-brand-500/10',  border: 'border-brand-500/20',  icon: 'text-brand-400',  badge: 'bg-brand-500/20 text-brand-300' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: 'text-green-400',  badge: 'bg-green-500/20 text-green-300' },
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: 'text-red-400',    badge: 'bg-red-500/20 text-red-300' },
}

export const StatCard: React.FC<Props> = ({ label, value, icon: Icon, trend, color = 'brand', index = 0 }) => {
  const c = COLORS[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn('card border', c.border, 'hover:border-opacity-40 transition-all duration-300')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {trend && (
            <div className={cn('inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium', c.badge)}>
              <span>{trend.value > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', c.bg)}>
          <Icon className={cn('w-6 h-6', c.icon)} />
        </div>
      </div>
    </motion.div>
  )
}
