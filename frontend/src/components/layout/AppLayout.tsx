import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, ClipboardCheck, Factory,
  Wallet, FileBarChart, LogOut, Menu, X, ChevronRight,
  Gauge, Bell
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',  short: 'Home'    },
  { to: '/employees',  icon: Users,           label: 'Employees',  short: 'Staff'   },
  { to: '/attendance', icon: ClipboardCheck,  label: 'Attendance', short: 'Attend'  },
  { to: '/production', icon: Factory,         label: 'Production', short: 'Work'    },
  { to: '/salary',     icon: Wallet,          label: 'Salary',     short: 'Pay'     },
  { to: '/reports',    icon: FileBarChart,    label: 'Reports',    short: 'Reports' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const currentPage = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.label || 'Weaver';

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
  };

  return (
    <div className="flex h-screen bg-[#060A14] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0A0F1E] border-r border-[#1E2D44] flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E2D44]">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Gauge className="w-4 h-4 text-[#060A14]" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">WEAVER</div>
            <div className="text-xs text-slate-500">Production Tracker</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                           : 'text-slate-400 hover:text-slate-200 hover:bg-[#141E2E]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-amber-500/50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-2.5 border-t border-[#1E2D44]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#141E2E] border border-[#1E2D44]">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-[#060A14] flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="p-1 text-slate-500 hover:text-rose-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`md:hidden fixed left-0 top-0 h-full w-64 z-50 bg-[#0A0F1E] border-r border-[#1E2D44]
        transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2D44]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-[#060A14]" />
            </div>
            <span className="font-bold text-white text-sm">WEAVER</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="px-2.5 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-[#141E2E]'}`
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-2.5 border-t border-[#1E2D44]">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-xs font-bold text-[#060A14]">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">{user?.full_name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0A0F1E] border-b border-[#1E2D44]">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-[#060A14]" />
            </div>
            <span className="font-bold text-white text-sm">{currentPage}</span>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0A0F1E]/95 backdrop-blur-md border-t border-[#1E2D44]">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map(({ to, icon: Icon, short }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] transition-all
                ${isActive ? 'text-amber-400' : 'text-slate-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-500/15' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-semibold">{short}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
