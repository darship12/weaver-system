import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  page?: number
  totalPages?: number
  onPageChange?: (p: number) => void
}

export function DataTable<T extends { id: number }>({
  data, columns, loading, emptyMessage = 'No data found.', page = 1, totalPages = 1, onPageChange
}: Props<T>) {
  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl shimmer" />
      ))}
    </div>
  )

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-surface-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-900/50">
              {columns.map(col => (
                <th key={col.key} className={cn('table-header text-left', col.className)}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-surface-500">{emptyMessage}</td></tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-surface-800/50 transition-colors"
                >
                  {columns.map(col => (
                    <td key={col.key} className={cn('table-cell', col.className)}>
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-surface-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-secondary py-1.5 px-3">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn-secondary py-1.5 px-3">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
