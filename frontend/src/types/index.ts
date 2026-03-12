export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'owner';
  is_staff: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export type LoomType = '2by1' | '4by1';
export type SkillLevel = 'trainee' | 'junior' | 'senior' | 'master';
export type EmployeeStatus = 'active' | 'inactive';
export type SareeLength = '6m' | '9m';
export type AttendanceStatus = 'present' | 'absent' | 'half_day';

export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  phone: string;
  address: string;
  skill_level: SkillLevel;
  loom_number: string;
  loom_type: LoomType;
  joining_date: string;
  status: EmployeeStatus;
  loom_type_display: string;
  skill_level_display: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  employee: number;
  employee_name: string;
  employee_id_code: string;
  date: string;
  status: AttendanceStatus;
  notes: string;
}

export interface ProductionEntry {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  date: string;
  loom_number: string;
  loom_type: LoomType;
  saree_length: SareeLength;
  saree_type: string;
  design_type: number;
  design_name: string;
  quantity: number;
  defects: number;
  work_hours: number;
  notes: string;
  wage_earned: string;
  saree_revenue: string;
  saree_expense: string;
  saree_profit: string;
  defect_rate: number;
  productivity: number;
  created_at: string;
}

export interface SareePricing {
  id: number;
  loom_type: LoomType;
  saree_length: SareeLength;
  saree_type: string;
  selling_price: string;
  expense: string;
  employee_wage: string;
  profit: string;
}

export interface DesignType {
  id: number;
  name: string;
  is_active: boolean;
}

// ── Add / replace these interfaces in src/types/index.ts ──────

export interface SalaryPayment {
  id:             number;
  amount:         number | string;
  payment_method: string;
  notes:          string;
  paid_on:        string;
  created_at:     string;
}

export interface SalaryLine {
  id:               number;
  date:             string | null;   // NEW field
  saree_type:       string;
  saree_type_label: string;
  loom_type:        string;
  saree_length:     string;
  quantity:         number;
  rate:             number | string;
  subtotal:         number | string;
}

export interface Salary {
  id:               number;
  employee:         number;
  employee_name:    string;
  employee_code:    string;
  period_start:     string;
  period_end:       string;
  period_type:      string;
  total_sarees:     number;
  total_wage:       number | string;

  // ── Credit-card payment fields (NEW) ─────────────────────
  paid_amount:      number | string;
  remaining_amount: number | string;
  status:           'unpaid' | 'partial' | 'paid';
  status_display:   string;

  // Legacy
  is_paid:          boolean;
  paid_date:        string | null;

  lines:    SalaryLine[];
  payments: SalaryPayment[];   // NEW

  created_at: string;
  updated_at: string;
}

export interface TopPerformer {
  employee__id: number;
  employee__name: string;
  employee__employee_id: string;
  total_sarees: number;
  total_wage: string;
  total_defects: number;
}

export interface DailyChartPoint {
  date: string;
  day: string;
  sarees: number;
  revenue: number;
}

export interface DashboardSummary {
  total_employees: number;
  today: { sarees: number; revenue: number; profit: number; present: number; absent: number; };
  this_week: { sarees: number; revenue: number; profit: number; };
  this_month: { sarees: number; revenue: number; profit: number; };
  top_performers: TopPerformer[];
  weekly_production_by_employee: Omit<TopPerformer, 'total_wage' | 'total_defects'>[];
  daily_chart: DailyChartPoint[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: T[];
}
