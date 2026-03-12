import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet, CheckCircle, IndianRupee, Download, Plus,
  ChevronDown, ChevronUp, X, Calendar, User,
} from "lucide-react";
import { salaryAPI, employeeAPI } from "../../services/api";
import type { Salary } from "../../types";
import toast from "react-hot-toast";

// ── helpers ──────────────────────────────────────────────────
function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - (day === 0 ? 6 : day - 1); // Mon = 0
  const start = new Date(d.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    partial: "bg-amber-500/15   text-amber-400   border-amber-500/30",
    unpaid:  "bg-rose-500/15    text-rose-400    border-rose-500/30",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${map[status] ?? map.unpaid}`}>
      {status}
    </span>
  );
}

// ── Add Payment Modal ────────────────────────────────────────
interface PaymentModalProps {
  salary: Salary;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ salary, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const remaining = Number(salary.remaining_amount);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > remaining) { toast.error(`Amount exceeds balance of Rs.${remaining.toLocaleString()}`); return; }

    setLoading(true);
    try {
      await (salaryAPI as any).addPayment(salary.id, {
        amount: amt,
        payment_method: method,
        notes,
        paid_on: paidOn,
      });
      toast.success("Payment recorded!");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0D1526] border border-[#1E2D44] rounded-2xl w-full max-w-md mx-4 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Add Payment</h2>
            <p className="text-slate-400 text-xs mt-0.5">{salary.employee_name} — {salary.employee_code}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credit card summary */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Total Salary",  val: Number(salary.total_wage),      color: "text-white" },
            { label: "Paid So Far",   val: Number(salary.paid_amount),     color: "text-emerald-400" },
            { label: "Remaining",     val: Number(salary.remaining_amount), color: "text-amber-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-[#060A14] rounded-xl p-3 border border-[#1E2D44] text-center">
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div className={`text-sm font-bold font-mono ${color}`}>
                Rs.{val.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Payment Amount (Rs.)</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 bg-[#060A14] border border-[#1E2D44] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                placeholder={`Max: Rs.${remaining.toLocaleString()}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                onClick={() => setAmount(String(remaining))}
                className="px-3 py-2 text-xs rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
              >
                Pay Full
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-[#060A14] border border-[#1E2D44] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              >
                {["UPI", "Cash", "Bank Transfer", "Cheque"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Payment Date</label>
              <input
                type="date"
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
                className="w-full bg-[#060A14] border border-[#1E2D44] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Weekly advance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#060A14] border border-[#1E2D44] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#1E2D44] text-slate-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment history expandable row ───────────────────────────
function PaymentHistory({ payments }: { payments: any[] }) {
  if (!payments?.length) return <div className="text-xs text-slate-500 py-2 px-4">No payments recorded yet.</div>;
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-slate-500">
          <td className="px-4 py-1.5 font-semibold">Date</td>
          <td className="px-4 py-1.5 font-semibold">Method</td>
          <td className="px-4 py-1.5 font-semibold text-right">Amount</td>
          <td className="px-4 py-1.5 font-semibold">Notes</td>
        </tr>
      </thead>
      <tbody>
        {payments.map((p: any) => (
          <tr key={p.id} className="border-t border-[#1E2D44]/50">
            <td className="px-4 py-1.5 text-slate-300 font-mono">{fmtDate(p.paid_on)}</td>
            <td className="px-4 py-1.5 text-slate-300">{p.payment_method}</td>
            <td className="px-4 py-1.5 text-emerald-400 font-mono text-right">Rs.{Number(p.amount).toLocaleString()}</td>
            <td className="px-4 py-1.5 text-slate-500">{p.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Salary Row ───────────────────────────────────────────────
function SalaryRow({
  s,
  onPay,
  onDownload,
}: {
  s: Salary;
  onPay: (s: Salary) => void;
  onDownload: (id: number, name: string, period: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-[#1E2D44] hover:bg-[#0D1526]/50 transition-colors">
        {/* Employee */}
        <td className="table-cell">
          <div className="text-sm font-semibold text-slate-200">{s.employee_name}</div>
          <div className="text-xs text-slate-500 font-mono">{s.employee_code}</div>
        </td>

        {/* Period */}
        <td className="table-cell text-xs text-slate-400 font-mono whitespace-nowrap">
          {fmtDate(s.period_start)}<br />
          <span className="text-slate-600">→</span> {fmtDate(s.period_end)}
        </td>

        {/* Sarees */}
        <td className="table-cell font-mono font-bold text-white text-center">
          {s.total_sarees}
        </td>

        {/* Total */}
        <td className="table-cell font-mono font-bold text-white">
          Rs.{Number(s.total_wage).toLocaleString()}
        </td>

        {/* Paid */}
        <td className="table-cell font-mono text-emerald-400">
          Rs.{Number(s.paid_amount).toLocaleString()}
        </td>

        {/* Remaining */}
        <td className="table-cell font-mono font-bold text-amber-400">
          Rs.{Number(s.remaining_amount).toLocaleString()}
        </td>

        {/* Status */}
        <td className="table-cell">
          <StatusBadge status={s.status ?? (s.is_paid ? "paid" : "unpaid")} />
        </td>

        {/* Actions */}
        <td className="table-cell">
          <div className="flex items-center gap-1.5">
            {(s.remaining_amount ?? 0) > 0 && (
              <button
                onClick={() => onPay(s)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" /> Pay
              </button>
            )}
            <button
              onClick={() => onDownload(s.id, s.employee_name, s.period_start)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
              title="Download Payslip"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-[#1E2D44] transition-colors"
              title="Payment history"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[#060A14]">
          <td colSpan={8} className="py-1">
            <PaymentHistory payments={s.payments as any[]} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function SalaryPage() {
  const qc = useQueryClient();

  // ── Week selector ─────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekRange, setWeekRange] = useState(() => getWeekRange(new Date()));

  useEffect(() => {
    setWeekRange(getWeekRange(new Date(selectedDate)));
  }, [selectedDate]);

  // ── Payslip download panel ────────────────────────────────
  const [dlEmployee, setDlEmployee] = useState<string>("");
  const [dlDate, setDlDate] = useState(today);
  const [downloading, setDownloading] = useState(false);

  // ── Payment modal ─────────────────────────────────────────
  const [payModal, setPayModal] = useState<Salary | null>(null);

  // ── Data queries ──────────────────────────────────────────
  const { data: salaries, isLoading } = useQuery<Salary[]>({
    queryKey: ["salary-week", weekRange.start],
    queryFn: () =>
      (salaryAPI as any)
        .weekSummary(selectedDate)
        .then((r: any) => r.data.results ?? r.data),
    refetchOnMount: "always",
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-dropdown"],
    queryFn: () => employeeAPI.dropdown().then((r) => r.data),
  });

  // Recalculate mutation
  const calcMutation = useMutation({
    mutationFn: () => salaryAPI.calculate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-week"] });
      toast.success("Salary recalculated!");
    },
  });

  // ── Download payslip ──────────────────────────────────────
  const downloadPayslip = async (
    salaryId: number,
    employeeName: string,
    period: string
  ) => {
    setDownloading(true);
    try {
      const res = await (salaryAPI as any).downloadPayslip(salaryId);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip_${employeeName.replace(/\s+/g, "_")}_${period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download payslip");
    } finally {
      setDownloading(false);
    }
  };

  // Download for selected employee in download panel
  const downloadForEmployee = async () => {
    if (!dlEmployee || !salaries) {
      toast.error("Select an employee first");
      return;
    }
    const weekSalary = salaries.find(
      (s) => String(s.employee) === dlEmployee || s.employee_code === dlEmployee
    );
    if (!weekSalary) {
      toast.error("No salary record for this employee in the selected week");
      return;
    }
    downloadPayslip(weekSalary.id, weekSalary.employee_name, weekRange.start);
  };

  // ── Stats ─────────────────────────────────────────────────
  const totalWage    = salaries?.reduce((a, s) => a + Number(s.total_wage), 0) ?? 0;
  const totalPaid    = salaries?.reduce((a, s) => a + Number(s.paid_amount), 0) ?? 0;
  const totalRemain  = salaries?.reduce((a, s) => a + Number(s.remaining_amount), 0) ?? 0;
  const paidCount    = salaries?.filter((s) => s.status === "paid").length ?? 0;
  const partialCount = salaries?.filter((s) => s.status === "partial").length ?? 0;
  const unpaidCount  = salaries?.filter((s) => s.status === "unpaid").length ?? 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Salary</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit-card style payroll — partial payments supported
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => calcMutation.mutate()}
            disabled={calcMutation.isPending}
            className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {calcMutation.isPending ? "Calculating…" : "Recalculate"}
          </button>
        </div>
      </div>

      {/* ── Week picker ── */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Select any date in a week</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#060A14] border border-[#1E2D44] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="text-xs text-slate-400 mt-4">
            Showing week:{" "}
            <span className="text-amber-400 font-mono font-semibold">
              {fmtDate(weekRange.start)} → {fmtDate(weekRange.end)}
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Payroll",  val: `Rs.${totalWage.toLocaleString()}`,   color: "text-white" },
          { label: "Total Paid",     val: `Rs.${totalPaid.toLocaleString()}`,    color: "text-emerald-400" },
          { label: "Total Pending",  val: `Rs.${totalRemain.toLocaleString()}`,  color: "text-amber-400" },
          { label: "Fully Paid",     val: paidCount,    color: "text-emerald-400" },
          { label: "Partial",        val: partialCount, color: "text-amber-400" },
          { label: "Unpaid",         val: unpaidCount,  color: "text-rose-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">{label}</div>
            <div className={`text-xl font-bold font-mono ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── Salary Table ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2D44] bg-[#060A14]">
                {["Employee", "Period", "Sarees", "Total", "Paid", "Remaining", "Status", "Actions"].map((h) => (
                  <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1E2D44]">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : !salaries?.length ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <Wallet className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-500 text-sm">No salary data for this week.</p>
                    <button
                      onClick={() => calcMutation.mutate()}
                      className="mt-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20"
                    >
                      Calculate Now
                    </button>
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <SalaryRow
                    key={s.id}
                    s={s}
                    onPay={setPayModal}
                    onDownload={downloadPayslip}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payslip Download Panel ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Download Payslip</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5">
              <User className="w-3 h-3 inline mr-1" />Employee
            </label>
            <select
              value={dlEmployee}
              onChange={(e) => setDlEmployee(e.target.value)}
              className="w-full bg-[#060A14] border border-[#1E2D44] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">— Select Employee —</option>
              {employees?.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />Any date in week
            </label>
            <input
              type="date"
              value={dlDate}
              onChange={(e) => setDlDate(e.target.value)}
              className="bg-[#060A14] border border-[#1E2D44] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={downloadForEmployee}
            disabled={!dlEmployee || downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Downloading…" : "Download PDF"}
          </button>
        </div>
        {dlEmployee && salaries && (
          <p className="text-xs text-slate-500 mt-2">
            Week: {fmtDate(weekRange.start)} → {fmtDate(weekRange.end)}
          </p>
        )}
      </div>

      {/* ── Wage Rates Reference ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Wage Rate Reference</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "2×1 / 6m", types: "Self Saree, Kadiyal", wage: "Rs.250/saree" },
            { label: "2×1 / 9m", types: "Gothila",             wage: "Rs.350/saree" },
            { label: "4×1 / 6m", types: "Self Saree, Kadiyal", wage: "Rs.300/saree" },
            { label: "4×1 / 9m", types: "Self Saree, Kadiyal", wage: "Rs.400/saree" },
          ].map((r) => (
            <div key={r.label} className="bg-[#060A14] rounded-xl p-3 border border-[#1E2D44]">
              <div className="text-xs font-bold text-amber-400">{r.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{r.types}</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">{r.wage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {payModal && (
        <PaymentModal
          salary={payModal}
          onClose={() => setPayModal(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["salary-week"] })}
        />
      )}
    </div>
  );
}
