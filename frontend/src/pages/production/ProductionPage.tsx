import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Factory,
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  IndianRupee,
  Edit,
  Trash2,
} from "lucide-react";
import { productionAPI, employeeAPI } from "../../services/api";
import type { ProductionEntry } from "../../types";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import toast from "react-hot-toast";
import { format } from "date-fns";

const schema = z.object({
  employee: z.number({ required_error: "Select employee" }).min(1),
  date: z.string().min(1),
  loom_number: z.string().min(1, "Required"),
  loom_type: z.enum(["2by1", "4by1"]),
  saree_length: z.enum(["6m", "9m"]),
  saree_type: z.string().min(1, "Required"),
  design_type: z.number({ required_error: "Select design" }).min(1),
  quantity: z.number().min(1),
  defects: z.number().min(0).default(0),
  // work_hours: z.number().min(0.5).max(24),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const SAREE_TYPES: Record<string, string[]> = {
  "2by1_6m": ["self_saree", "kadiyal"],
  "2by1_9m": ["gothila"],
  "4by1_6m": ["self_saree", "kadiyal"],
  "4by1_9m": ["self_saree", "kadiyal"],
};
const WAGE_MAP: Record<string, number> = {
  "2by1_6m_self_saree": 250,
  "2by1_6m_kadiyal": 250,
  "2by1_9m_gothila": 350,
  "4by1_6m_self_saree": 300,
  "4by1_6m_kadiyal": 300,
  "4by1_9m_self_saree": 400,
  "4by1_9m_kadiyal": 400,
};
const PRICE_MAP: Record<string, { price: number; profit: number }> = {
  "2by1_6m": { price: 1300, profit: 400 },
  "2by1_9m": { price: 1800, profit: 800 },
  "4by1_6m": { price: 1650, profit: 650 },
  "4by1_9m": { price: 2200, profit: 1000 },
};

export default function ProductionPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProductionEntry | null>(null);
  const qc = useQueryClient();

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["production", search],
    queryFn: () =>
      productionAPI.list({ search, page_size: 30 }).then((r) => r.data),
  });
  const { data: employees } = useQuery({
    queryKey: ["emp-dropdown"],
    queryFn: () => employeeAPI.dropdown().then((r) => r.data),
  });
  const { data: designsData } = useQuery({
    queryKey: ["designs"],
    queryFn: () => productionAPI.designs().then((r) => r.data),
  });
  const designs = Array.isArray(designsData)
    ? designsData
    : (designsData as any)?.results || [];

  const mutation = useMutation({
    mutationFn: (d: FormData) =>
      editing ? productionAPI.update(editing.id, d) : productionAPI.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(editing ? "Entry updated!" : "Entry saved!");
      setShowForm(false);
      setEditing(null);
      reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Entry removed");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Error deleting"),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      defects: 0,
      loom_type: "2by1",
      saree_length: "6m",
    },
  });

  const [wLoom, wLen, wType, wQty, wDef] = watch([
    "loom_type",
    "saree_length",
    "saree_type",
    "quantity",
    "defects",
  ]);
  const sareeKey = `${wLoom}_${wLen}`;
  const fullKey = `${sareeKey}_${wType}`;
  const availableTypes = SAREE_TYPES[sareeKey] || [];
  const wage = WAGE_MAP[fullKey] || 0;
  const pricing = PRICE_MAP[sareeKey];
  const qty = wQty || 0;
  const defects = wDef || 0;
  const goodQty = Math.max(qty - defects, 0);

  const onEmpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const emp = (employees as any[])?.find(
      (em: any) => em.id === Number(e.target.value),
    );
    if (emp) {
      setValue("employee", emp.id);
      setValue("loom_number", emp.loom_number);
      setValue("loom_type", emp.loom_type);
    }
  };

  const handleEdit = (entry: ProductionEntry) => {
    setEditing(entry);
    setShowForm(true);
    reset({
      employee: entry.employee,
      date: entry.date,
      loom_number: entry.loom_number,
      loom_type: entry.loom_type,
      saree_length: entry.saree_length,
      saree_type: entry.saree_type,
      design_type: entry.design_type || undefined,
      quantity: entry.quantity,
      defects: entry.defects,
      notes: entry.notes || undefined,
    });
  };

  const entries: ProductionEntry[] = pageData?.results || [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Production</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily saree production tracker
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
            reset();
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))
        ) : !entries.length ? (
          <EmptyState
            icon={Factory}
            title="No entries"
            description="Add daily production records"
            action={{ label: "Add", onClick: () => setShowForm(true) }}
          />
        ) : (
          entries.map((e) => (
            <div key={e.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {e.employee_name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {e.date} · {e.loom_number}
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => handleEdit(e)}
                  >
                    Edit
                  </button>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    ₹{Number(e.wage_earned).toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-400 font-mono">
                    +₹{Number(e.saree_profit).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${e.loom_type === "2by1" ? "badge-blue" : "badge-amber"}`}
                >
                  {e.loom_type}·{e.saree_length}
                </span>
                <span className="text-xs text-slate-400">
                  {e.quantity} sarees
                </span>
                {e.defects > 0 && (
                  <span className="badge badge-red">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {e.defects} defects
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2D44] bg-[#060A14]">
                {[
                  "Date",
                  "Employee",
                  "Loom",
                  "Type",
                  "Design",
                  "Qty",
                  "Defects",
                  "Wage",
                  "Profit",
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
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1E2D44]">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="skeleton h-4 w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !entries.length ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={Factory}
                      title="No entries"
                      description="Add daily production records"
                      action={{
                        label: "Add",
                        onClick: () => setShowForm(true),
                      }}
                    />
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="table-row">
                    <td className="table-cell font-mono text-xs">{e.date}</td>
                    <td className="table-cell">
                      <div className="text-sm font-medium text-slate-200">
                        {e.employee_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {e.employee_code}
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {e.loom_number}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${e.loom_type === "2by1" ? "badge-blue" : "badge-amber"}`}
                      >
                        {e.loom_type}·{e.saree_length}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {e.design_name}
                    </td>
                    <td className="table-cell font-mono font-bold text-white">
                      {e.quantity}
                    </td>
                    <td className="table-cell">
                      <span
                        className={
                          e.defects > 0
                            ? "text-rose-400 text-xs font-mono"
                            : "text-slate-600 text-xs"
                        }
                      >
                        {e.defects > 0 && (
                          <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                        )}
                        {e.defects}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-amber-400 text-xs">
                      ₹{Number(e.wage_earned).toLocaleString()}
                    </td>
                    <td className="table-cell font-mono text-emerald-400 text-xs">
                      ₹{Number(e.saree_profit).toLocaleString()}
                    </td>
                    {/* <td
                      className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      onClick={() => handleEdit(e)}
                    >
                      <Edit className="w-3.5 h-3.5" />{" "}
                    </td> */}
                    <td
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      onClick={() => {
                        if (confirm("Delete entry?"))
                          deleteMutation.mutate(e.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
          reset();
        }}
        title={editing ? "Edit Production Entry" : "Add Production Entry"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Employee *</label>
              <select className="select" onChange={onEmpChange} defaultValue="">
                <option value="" disabled>
                  Select employee...
                </option>
                {((employees as any[]) || []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employee_id})
                  </option>
                ))}
              </select>
              {errors.employee && (
                <p className="text-xs text-rose-400 mt-1">
                  {errors.employee.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                {...register("date")}
                className="input text-white 
               [&::-webkit-calendar-picker-indicator]:invert
               [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div>
              <label className="label">Loom Number</label>
              <input
                {...register("loom_number")}
                className="input"
                placeholder="Loom 01"
              />
            </div>
            <div>
              <label className="label">Loom Type *</label>
              <select {...register("loom_type")} className="select">
                <option value="2by1">2 by 1</option>
                <option value="4by1">4 by 1</option>
              </select>
            </div>
            <div>
              <label className="label">Saree Length *</label>
              <select {...register("saree_length")} className="select">
                <option value="6m">6 Meter</option>
                <option value="9m">9 Meter</option>
              </select>
            </div>
            <div>
              <label className="label">Saree Type *</label>
              <select
                {...register("saree_type")}
                className="select"
                defaultValue=""
              >
                <option value="" disabled>
                  Select type...
                </option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.saree_type && (
                <p className="text-xs text-rose-400 mt-1">
                  {errors.saree_type.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Design *</label>
              <select
                {...register("design_type", { valueAsNumber: true })}
                className="select"
                defaultValue=""
              >
                <option value="" disabled>
                  Select design...
                </option>
                {designs.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                min="1"
                {...register("quantity", { valueAsNumber: true })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Defects</label>
              <input
                type="number"
                min="0"
                {...register("defects", { valueAsNumber: true })}
                className="input"
                defaultValue="0"
              />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="input resize-none"
            />
          </div>

          {qty > 0 && wage > 0 && (
            <div className="rounded-xl bg-[#060A14] border border-amber-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Live Preview
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[
                  {
                    label: "Wage",
                    value: `₹${(goodQty * wage).toLocaleString()}`,
                    color: "text-amber-400",
                  },
                  {
                    label: "Revenue",
                    value: pricing
                      ? `₹${(qty * pricing.price).toLocaleString()}`
                      : "—",
                    color: "text-blue-400",
                  },
                  {
                    label: "Profit",
                    value: pricing
                      ? `₹${(qty * pricing.profit).toLocaleString()}`
                      : "—",
                    color: "text-emerald-400",
                  },
                  {
                    label: "Defect ",
                    value: qty > 0 ? `${defects}` : "0",
                    color:
                      defects / Math.max(qty, 0) > 1
                        ? "text-rose-400"
                        : "text-slate-300",
                  },
                  // { label: 'Defect ', value: qty > 0 ? `${defects}` : '0', color: defects / Math.max(qty, 1) > 1 ? 'text-rose-400' : 'text-slate-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0D1526] rounded-lg p-2">
                    <div className="text-[10px] text-slate-500">{label}</div>
                    <div className={`text-sm font-bold font-mono ${color}`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
