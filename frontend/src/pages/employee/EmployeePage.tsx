import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Users, Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";
import { employeeAPI } from "../../services/api";
import type { Employee } from "../../types";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import toast from "react-hot-toast";

export default function EmployeePage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["employees", search],
    queryFn: () =>
      employeeAPI.list({ search, page_size: 50 }).then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<any>();

  const mutation = useMutation({
    mutationFn: (d: any) =>
      editing ? employeeAPI.update(editing.id, d) : employeeAPI.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["emp-dropdown"] });
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["salary-weekly"] });
      toast.success(editing ? "Updated!" : "Employee added!");
      close();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Error saving"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["emp-dropdown"] });
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["salary-weekly"] });
      toast.success("Employee removed");
    },
  });

  const close = () => {
    setShowForm(false);
    setEditing(null);
    reset();
  };
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    Object.entries(emp).forEach(([k, v]) => setValue(k, v));
    setShowForm(true);
  };

  const skillColor: Record<string, string> = {
    trainee: "badge-blue",
    junior: "badge-amber",
    senior: "badge-green",
    master: "badge-purple",
  };

  const employees: Employee[] = data?.results || [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {employees.length} weavers on record
          </p>
        </div>
        <button
          onClick={() => {
            close();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))
        ) : !employees.length ? (
          <EmptyState
            icon={Users}
            title="No employees"
            description="Add weavers to get started"
            action={{ label: "Add", onClick: () => setShowForm(true) }}
          />
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400 flex-shrink-0">
                {emp.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">
                  {emp.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono">
                    {emp.employee_id}
                  </span>
                  <span
                    className={`badge ${emp.status === "active" ? "badge-green" : "badge-red"}`}
                  >
                    {emp.status}
                  </span>
                  <span
                    className={`badge ${emp.loom_type === "2by1" ? "badge-blue" : "badge-amber"}`}
                  >
                    {emp.loom_type}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(emp)}
                  className="p-2 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Remove?")) deleteMutation.mutate(emp.id);
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
                  "Employee",
                  "Loom",
                  "Type",
                  "Skill",
                  "Joined",
                  "Status",
                  "",
                ].map((h) => (
                  <th key={h} className="table-header text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1E2D44]">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="skeleton h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !employees.length ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Users}
                      title="No employees"
                      description="Add weavers to get started"
                      action={{
                        label: "Add",
                        onClick: () => setShowForm(true),
                      }}
                    />
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
                          {emp.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {emp.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {emp.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {emp.loom_number}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${emp.loom_type === "2by1" ? "badge-blue" : "badge-amber"}`}
                      >
                        {emp.loom_type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${skillColor[emp.skill_level] || "badge-blue"}`}
                      >
                        {emp.skill_level}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-400 font-mono">
                      {emp.joining_date}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${emp.status === "active" ? "badge-green" : "badge-red"}`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Remove?"))
                              deleteMutation.mutate(emp.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
        onClose={close}
        title={editing ? "Edit Employee" : "Add Employee"}
      >
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name *</label>
              <input
                {...register("name", { required: "Required" })}
                className="input"
                placeholder="Full name"
              />
              {errors.name && (
                <p className="text-xs text-rose-400 mt-1">
                  {String(errors.name.message)}
                </p>
              )}
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                {...register("phone")}
                className="input"
                placeholder="Mobile"
              />
            </div>
            <div>
              <label className="label">Loom Number *</label>
              <input
                {...register("loom_number", { required: "Required" })}
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
              <label className="label">Skill Level</label>
              <select {...register("skill_level")} className="select">
                <option value="trainee">Trainee</option>
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
                <option value="master">Master</option>
              </select>
            </div>
            <div>
              <label className="label">Joining Date *</label>
              <input
                type="date"
                {...register("joining_date", { required: "Required" })}
                className="input text-white 
               [&::-webkit-calendar-picker-indicator]:invert
               [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register("status")} className="select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <textarea
                {...register("address")}
                rows={2}
                className="input resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {editing ? "Update" : "Add Employee"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
