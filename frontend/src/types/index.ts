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

export interface SalaryLine {
  id: number;
  saree_type_label: string;
  quantity: number;
  rate: string;
  subtotal: string;
}

export interface Salary {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_sarees: number;
  total_wage: string;
  is_paid: boolean;
  paid_date: string | null;
  lines: SalaryLine[];
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
