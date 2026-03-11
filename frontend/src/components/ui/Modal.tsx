import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export const Modal: React.FC<Props> = ({ open, onClose, title, children, size = 'md' }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`relative w-full ${SIZES[size]} bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
            <h2 className="section-title">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)
