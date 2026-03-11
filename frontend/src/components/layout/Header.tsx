import React from 'react'
import { Menu, Bell, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store'
import { format } from 'date-fns'

interface Props { onMenuClick: () => void; title?: string }

export const Header: React.FC<Props> = ({ onMenuClick, title }) => {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  return (
    <header className="h-16 bg-surface-950/80 backdrop-blur-sm border-b border-surface-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-surface-800 text-surface-400">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          {title && <h1 className="font-display font-semibold text-surface-100 text-lg leading-none">{title}</h1>}
          <p className="text-xs text-surface-500 mt-0.5">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => qc.invalidateQueries()}
          className="p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-brand-400 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 rounded-xl border border-surface-700">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-xs font-bold text-surface-950">
              {(user?.full_name || user?.username)?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-surface-200">{user?.full_name || user?.username}</div>
            <div className="text-xs text-surface-500 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
