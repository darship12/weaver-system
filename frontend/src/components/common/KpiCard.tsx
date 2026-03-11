import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'amber' | 'jade' | 'rose' | 'blue';
  trend?: { value: number; label: string };
  loading?: boolean;
  delay?: number;
}

const colorMap = {
  amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'border-amber-500/20', bar: 'from-amber-500/60' },
  jade:  { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'border-emerald-500/20', bar: 'from-emerald-500/60' },
  rose:  { icon: 'text-rose-400', bg: 'bg-rose-500/10', glow: 'border-rose-500/20', bar: 'from-rose-500/60' },
  blue:  { icon: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'border-blue-500/20', bar: 'from-blue-500/60' },
};

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'amber', trend, loading, delay = 0 }: KpiCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#1E2D44] bg-[#0D1526] p-5">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={`anim-fade-up delay-${delay} rounded-2xl border border-[#1E2D44] bg-[#0D1526] p-5 relative overflow-hidden`}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 w-1/2 h-0.5 bg-gradient-to-r ${c.bar} to-transparent`} />

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`${c.bg} ${c.glow} border p-2 rounded-xl`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>

      <div className="anim-count-up">
        <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      </div>

      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="font-semibold">{Math.abs(trend.value)}%</span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
