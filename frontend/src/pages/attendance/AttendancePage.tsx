import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { attendanceAPI, employeeAPI } from "../../services/api";
import type { Employee, AttendanceStatus } from "../../types";
import toast from "react-hot-toast";
import { format } from "date-fns";

type LocalRecord = {
  employee_id: number;
  name: string;
  emp_code: string;
  status: AttendanceStatus;
};

const STATUS_CFG = {
  present: {
    label: "Present",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Icon: CheckCircle,
  },
  absent: {
    label: "Absent",
    color: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    Icon: XCircle,
  },
  half_day: {
    label: "Half Day",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Icon: Clock,
  },
};

export default function AttendancePage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [records, setRecords] = useState<LocalRecord[]>([]);
  const qc = useQueryClient();

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees-active"],
    queryFn: () =>
      employeeAPI
        .list({ status: "active", page_size: 100 })
        .then((r) => r.data.results),
  });
  const { data: existing } = useQuery({
    queryKey: ["attendance", date],
    queryFn: () => attendanceAPI.list({ date }).then((r) => r.data.results),
  });

  useEffect(() => {
    if (!employees) return;
    const map = new Map(
      (existing || []).map((a: any) => [a.employee, a.status]),
    );
    setRecords(
      employees.map((e) => ({
        employee_id: e.id,
        name: e.name,
        emp_code: e.employee_id,
        status: (map.get(e.id) as AttendanceStatus) || "present",
      })),
    );
  }, [employees, existing, date]);

  const mutation = useMutation({
    mutationFn: () =>
      attendanceAPI.bulkMark({
        date,
        records: records.map((r) => ({
          employee_id: r.employee_id,
          status: r.status,
        })),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["salary-weekly"] });
      toast.success(`Saved ${res.data.created + res.data.updated} records`);
    },
    onError: () => toast.error("Failed to save"),
  });

  const toggle = (id: number) => {
    const order: AttendanceStatus[] = ["present", "absent", "half_day"];
    setRecords((p) =>
      p.map((r) =>
        r.employee_id === id
          ? { ...r, status: order[(order.indexOf(r.status) + 1) % 3] }
          : r,
      ),
    );
  };
  const setAll = (s: AttendanceStatus) =>
    setRecords((p) => p.map((r) => ({ ...r, status: s })));
  const summary = records.reduce(
    (a, r) => {
      a[r.status] = (a[r.status] || 0) + 1;
      return a;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily attendance sheet
          </p>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !records.length}
          className="btn-primary"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}{" "}
          Save All
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd")}
            className="input text-white 
               [&::-webkit-calendar-picker-indicator]:invert
               [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(STATUS_CFG).map(([s, c]) => (
            <div
              key={s}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${c.color}`}
            >
              {summary[s] || 0} {c.label}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setAll("present")} className="btn-ghost text-xs">
          Mark All Present
        </button>
        <button onClick={() => setAll("absent")} className="btn-ghost text-xs">
          Mark All Absent
        </button>
      </div>
      <div className="card overflow-hidden">
        {!records.length ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500 text-sm">No active employees</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E2D44]">
            {records.map((r) => {
              const cfg = STATUS_CFG[r.status];
              return (
                <div
                  key={r.employee_id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#0A1020] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#141E2E] border border-[#1E2D44] flex items-center justify-center text-xs font-bold text-amber-400">
                      {r.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {r.emp_code}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(r.employee_id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${cfg.color}`}
                  >
                    <cfg.Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-600 text-center">
        Tap status to cycle: Present → Absent → Half Day
      </p>
    </div>
  );
}
