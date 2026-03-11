import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Users, ClipboardCheck, Scissors, Wallet, FileBarChart, Settings, LogOut, Menu, X, ChevronRight, Layers } from 'lucide-react'
import { cn } from '@/utils'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','supervisor','owner'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin','supervisor','owner'] },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin','supervisor','owner'] },
  { to: '/production', label: 'Production', icon: Scissors, roles: ['admin','supervisor','owner'] },
  { to: '/salary', label: 'Salary', icon: Wallet, roles: ['admin','owner'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin','owner'] },
]

interface Props { collapsed: boolean; onToggle: () => void }

export const Sidebar: React.FC<Props> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const visibleNav = NAV.filter(n => user && n.roles.includes(user.role))

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full bg-surface-950 border-r border-surface-800 z-30 flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-800 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-surface-950" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="font-display font-bold text-surface-50 leading-none">Weaver</div>
                <div className="text-xs text-surface-500 mt-0.5">Production System</div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={onToggle}
            className="ml-auto p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800'
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-brand-500/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('w-5 h-5 flex-shrink-0 relative z-10', isActive ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-200')} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="text-sm font-medium relative z-10 whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-2 pb-4 border-t border-surface-800 pt-4 space-y-1">
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 py-2.5 mb-2"
              >
                <div className="text-sm font-semibold text-surface-200 truncate">
                  {user.full_name || user.username}
                </div>
                <div className="text-xs text-surface-500 capitalize mt-0.5">{user.role}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap">Logout</motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  )
}
