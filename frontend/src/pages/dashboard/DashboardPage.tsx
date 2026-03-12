import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Users,
  Factory,
  Wallet,
  TrendingUp,
  Trophy,
  CalendarCheck,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { dashboardAPI } from "../../services/api";
import type { DashboardSummary } from "../../types";
import KpiCard from "../../components/common/KpiCard";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
      ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141E2E] border border-[#2D4060] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-mono font-bold text-white">
            {p.name === "Revenue" ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, refetch, isFetching } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardAPI.summary().then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {format(new Date(), "EEEE, dd MMM yyyy")}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary text-xs px-3 py-2"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Active Staff"
          value={data?.total_employees ?? "—"}
          icon={Users}
          color="blue"
          loading={isLoading}
        />
        <KpiCard
          title="Today's Sarees"
          value={data?.today.sarees ?? "—"}
          icon={Factory}
          color="amber"
          loading={isLoading}
          subtitle={`${data?.today.present ?? 0} present / ${data?.today.absent ?? 0} absent`}
        />
        <KpiCard
          title="Week Revenue"
          value={data ? fmt(data.this_week.revenue) : "—"}
          icon={Wallet}
          color="jade"
          loading={isLoading}
          subtitle={`${data?.this_week.sarees ?? 0} sarees`}
        />
        <KpiCard
          title="Month Profit"
          value={data ? fmt(data.this_month.profit) : "—"}
          icon={TrendingUp}
          color="rose"
          loading={isLoading}
          delay={4}
          subtitle={`${data?.this_month.sarees ?? 0} sarees`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5 anim-fade-up delay-3">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Daily Production</h2>
            <p className="text-xs text-slate-500">Last 7 days</p>
          </div>
          {isLoading ? (
            <div className="skeleton h-48" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={data?.daily_chart || []}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Area
                    type="monotone"
                    dataKey="sarees"
                    name="Sarees"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill="url(#ga)"
                    dot={{ fill: "#F59E0B", r: 3, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
        <div className="card p-5 anim-fade-up delay-4">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Revenue</h2>
            <p className="text-xs text-slate-500">Last 7 days</p>
          </div>
          {isLoading ? (
            <div className="skeleton h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data?.daily_chart || []}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                  }
                />
                <Tooltip content={<ChartTip />} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 anim-fade-up delay-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Top Performers</h2>
            </div>
            <span className="text-xs text-slate-500">This Week</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-10" />
              ))}
            </div>
          ) : !data?.top_performers?.length ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No production data yet
            </p>
          ) : (
            <div className="space-y-2">
              {data.top_performers.slice(0, 5).map((p, i) => (
                <div
                  key={p.employee__id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#060A14] border border-[#1E2D44]"
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-500 text-[#060A14]" : i === 1 ? "bg-slate-400 text-[#060A14]" : i === 2 ? "bg-amber-700 text-white" : "bg-[#1E2D44] text-slate-400"}`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {p.employee__name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {p.employee__employee_id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-400 font-mono">
                      {p.total_sarees} pcs
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ₹{Number(p.total_wage).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 anim-fade-up delay-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Period Summary</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "This Week",
                data: data?.this_week,
                color: "text-amber-400",
              },
              {
                label: "This Month",
                data: data?.this_month,
                color: "text-emerald-400",
              },
            ].map(({ label, data: d, color }) => (
              <div
                key={label}
                className="rounded-xl bg-[#060A14] border border-[#1E2D44] p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${color}`}>{label}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {(d as any)?.sarees ?? 0} sarees
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-500">Revenue</div>
                    <div className="font-mono font-semibold text-white">
                      {fmt((d as any)?.revenue ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Profit</div>
                    <div className="font-mono font-semibold text-emerald-400">
                      {fmt((d as any)?.profit ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              {
                to: "/production",
                label: "Production",
                color: "text-amber-400",
              },
              {
                to: "/attendance",
                label: "Attendance",
                color: "text-blue-400",
              },
              { to: "/reports", label: "Reports", color: "text-emerald-400" },
            ].map(({ to, label, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-center gap-1 py-2 rounded-xl bg-[#141E2E] border border-[#1E2D44] hover:border-[#2D4060] transition-colors text-xs font-medium text-slate-400 hover:text-white"
              >
                <ArrowRight className={`w-3 h-3 ${color}`} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
