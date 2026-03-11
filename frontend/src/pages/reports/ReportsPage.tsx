import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileBarChart,
  TrendingUp,
  Users,
  AlertTriangle,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { productionAPI } from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141E2E] border border-[#2D4060] rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-mono font-semibold text-white">
            {p.name.includes("₹")
              ? `₹${Number(p.value).toLocaleString()}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["production-summary", period],
    queryFn: () => productionAPI.summary(period).then((r) => r.data),
  });

  const { data: defects, isLoading: defLoading } = useQuery({
    queryKey: ["defects"],
    queryFn: () => productionAPI.defects().then((r) => r.data),
  });

  const { data: topPerformers } = useQuery({
    queryKey: ["top-performers"],
    queryFn: () => productionAPI.topPerformers().then((r) => r.data),
  });

  const { data: chart } = useQuery({
    queryKey: ["daily-chart", 14],
    queryFn: () => productionAPI.dailyChart(14).then((r) => r.data),
  });

  // Aggregate chart data by date
  const chartData = chart
    ? Object.entries(
        (chart as any[]).reduce((acc: any, item: any) => {
          if (!acc[item.date])
            acc[item.date] = { date: item.date, sarees: 0, revenue: 0 };
          acc[item.date].sarees += item.total;
          acc[item.date].revenue += Number(item.revenue);
          return acc;
        }, {}),
      ).map(([, v]) => v)
    : [];

  const handleExport = () => {
    if (!summary) {
      toast.error('Nothing to export yet');
      return;
    }

    const rows: string[] = [];
    rows.push('Weaver Production Report');
    rows.push(`Generated,${new Date().toISOString()}`);
    rows.push('');
    rows.push('Summary,Value');
    rows.push(`Total Sarees,${summary.total_sarees}`);
    rows.push(`Revenue,${summary.total_revenue}`);
    rows.push(`Profit,${summary.total_profit}`);
    rows.push(`Wage,${summary.total_wage}`);
    rows.push('');
    rows.push('Top Performers,Name,Sarees,Wage');
    (topPerformers as any[] || []).forEach((p: any) => {
      rows.push(`${p.employee__name},${p.total_sarees},${p.total_wage}`);
    });
    rows.push('');
    rows.push('Daily Chart,Date,Sarees,Revenue');
    chartData.forEach((c) => {
      rows.push(`${c.date},${c.sarees},${c.revenue}`);
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weaver-report-${format(new Date(), 'yyyyMMddHHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success('Report downloaded');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production analytics & insights
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary text-xs">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(["today", "week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all
              ${period === p ? "bg-amber-500 text-[#060A14]" : "bg-[#141E2E] border border-[#1E2D44] text-slate-400 hover:text-slate-200"}`}
          >
            {p === "today"
              ? "Today"
              : p === "week"
                ? "This Week"
                : "This Month"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Sarees",
            val: summary?.total_sarees || 0,
            color: "text-white",
          },
          {
            label: "Revenue",
            val: `₹${Number(summary?.total_revenue || 0).toLocaleString()}`,
            color: "text-blue-400",
          },
          {
            label: "Total Profit",
            val: `₹${Number(summary?.total_profit || 0).toLocaleString()}`,
            color: "text-emerald-400",
          },
          {
            label: "Total Wage",
            val: `₹${Number(summary?.total_wage || 0).toLocaleString()}`,
            color: "text-amber-400",
          },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
              {label}
            </div>
            {sumLoading ? (
              <div className="skeleton h-6 w-24" />
            ) : (
              <div className={`text-xl font-bold font-mono ${color}`}>
                {val}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-bold text-white mb-4">
            Production & Revenue (14 days)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => format(new Date(v), "dd/MM")}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#64748B" }} />
              <Bar
                yAxisId="left"
                dataKey="sarees"
                name="Sarees"
                fill="#F59E0B"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                name="₹Revenue"
                fill="#10B981"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              Top Performers (This Week)
            </h2>
          </div>
          <div className="space-y-2">
            {!topPerformers?.length ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No data yet
              </p>
            ) : (
              (topPerformers as any[]).slice(0, 6).map((p: any, i: number) => {
                const maxSarees =
                  (topPerformers as any[])[0]?.total_sarees || 1;
                const pct = Math.round((p.total_sarees / maxSarees) * 100);
                return (
                  <div
                    key={p.employee__id}
                    className="flex items-center gap-2.5"
                  >
                    <span className="text-xs text-slate-500 w-4 text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-slate-300">
                          {p.employee__name}
                        </span>
                        <span className="text-xs font-mono text-amber-400">
                          {p.total_sarees} pcs
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1E2D44] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Defects Table */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-bold text-white">
            Defect Report (This Week)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2D44]">
                {["Employee", "Total Sarees", "Defects", "Defect Rate"].map(
                  (h) => (
                    <th key={h} className="table-header text-left">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {defLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1E2D44]">
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="skeleton h-4 w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !(defects as any[])?.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="table-cell text-slate-500 text-center py-6"
                  >
                    No defect data this week
                  </td>
                </tr>
              ) : (
                (defects as any[]).map((d: any) => {
                  const rate = d.total_sarees
                    ? ((d.total_defects / d.total_sarees) * 100).toFixed(1)
                    : "0.0";
                  const isHigh = Number(rate) > 10;
                  return (
                    <tr key={d.employee__id} className="table-row">
                      <td className="table-cell">
                        <div className="text-sm font-medium text-slate-200">
                          {d.employee__name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {d.employee__employee_id}
                        </div>
                      </td>
                      <td className="table-cell font-mono text-slate-300">
                        {d.total_sarees}
                      </td>
                      <td className="table-cell font-mono text-slate-300">
                        {d.total_defects || 0}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${isHigh ? "badge-red" : "badge-green"}`}
                        >
                          {isHigh && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
