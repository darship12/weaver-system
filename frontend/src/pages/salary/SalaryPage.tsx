import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  RefreshCw,
  Loader2,
  CheckCircle,
  IndianRupee,
} from "lucide-react";
import { salaryAPI } from "../../services/api";
import type { Salary } from "../../types";
import toast from "react-hot-toast";

export default function SalaryPage() {
  const qc = useQueryClient();
  const { data: salaries, isLoading } = useQuery<Salary[]>({
    queryKey: ["salary-weekly"],
    queryFn: () => salaryAPI.weeklySummary().then((r) => r.data),
  });

  const calcMutation = useMutation({
    mutationFn: () => salaryAPI.calculate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-weekly"] });
      toast.success("Salary calculation started!");
    },
    onError: () => toast.error("Calculation failed"),
  });

  const paidMutation = useMutation({
    mutationFn: (id: number) => salaryAPI.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-weekly"] });
      toast.success("Marked as paid!");
    },
  });

  const totalWage =
    salaries?.reduce((a, s) => a + Number(s.total_wage), 0) || 0;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Salary</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly salary summary — piece-rate calculation
          </p>
        </div>
        <button
          onClick={() => calcMutation.mutate()}
          disabled={calcMutation.isPending}
          className="btn-secondary"
        >
          {calcMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}{" "}
          Recalculate
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 sm:col-span-1">
          <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
            Total This Week
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            ₹{totalWage.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {salaries?.length || 0} employees
          </div>
        </div>
        <div className="card p-4 sm:col-span-1">
          <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
            Paid
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {salaries?.filter((s) => s.is_paid).length || 0}
          </div>
        </div>
        <div className="card p-4 sm:col-span-1">
          <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
            Pending
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {salaries?.filter((s) => !s.is_paid).length || 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2D44] bg-[#060A14]">
                {[
                  "Employee",
                  "Period",
                  "Sarees",
                  "Wage",
                  "Breakdown",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="table-header text-left whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1E2D44]">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="skeleton h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !salaries?.length ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Wallet className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-500 text-sm">
                      No salary data yet. Click Recalculate to generate.
                    </p>
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell">
                      <div className="text-sm font-medium text-slate-200">
                        {s.employee_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {s.employee_code}
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-400 font-mono">
                      {s.period_start} → {s.period_end}
                    </td>
                    <td className="table-cell font-mono font-bold text-white">
                      {s.total_sarees}
                    </td>
                    <td className="table-cell font-mono font-bold text-amber-400">
                      ₹{Number(s.total_wage).toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <div className="space-y-0.5">
                        {s.lines?.slice(0, 2).map((l) => (
                          <div key={l.id} className="text-xs text-slate-500">
                            {l.saree_type_label}: {l.quantity}×₹{l.rate} ={" "}
                            <span className="text-slate-300">
                              ₹{l.subtotal}
                            </span>
                          </div>
                        ))}
                        {(s.lines?.length || 0) > 2 && (
                          <div className="text-xs text-slate-600">
                            +{s.lines.length - 2} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${s.is_paid ? "badge-green" : "badge-amber"}`}
                      >
                        {s.is_paid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="table-cell">
                      {!s.is_paid && (
                        <button
                          onClick={() => paidMutation.mutate(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wage Rates Reference */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Wage Rate Reference</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "2×1 / 6m",
              types: "Self Saree, Kadiyal",
              wage: "₹250/saree",
            },
            { label: "2×1 / 9m", types: "Gothila", wage: "₹350/saree" },
            {
              label: "4×1 / 6m",
              types: "Self Saree, Kadiyal",
              wage: "₹300/saree",
            },
            {
              label: "4×1 / 9m",
              types: "Self Saree, Kadiyal",
              wage: "₹400/saree",
            },
          ].map((r) => (
            <div
              key={r.label}
              className="bg-[#060A14] rounded-xl p-3 border border-[#1E2D44]"
            >
              <div className="text-xs font-bold text-amber-400">{r.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{r.types}</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {r.wage}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
