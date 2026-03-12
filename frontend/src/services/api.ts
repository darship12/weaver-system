import axios, { AxiosError } from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let accessToken: string | null = null;
let refreshPromise: Promise<any> | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error('No refresh token');
  const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
  const data = response.data;
  setAccessToken(data.access);
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  return data;
}

// ── Interceptors ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
        }
        const data = (await refreshPromise) as any;
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        setAccessToken(null);
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('weaver-auth');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:          (username: string, password: string) =>
                    api.post('/auth/login/', { username, password }),
  logout:         (refresh_token: string) =>
                    api.post('/auth/logout/', { refresh_token }),
  refresh:        (refresh_token: string) =>
                    api.post('/auth/token/refresh/', { refresh: refresh_token }),
  me:             () => api.get('/auth/me/'),
  changePassword: (data: { old_password: string; new_password: string }) =>
                    api.post('/auth/change-password/', data),
};

// ── Employees ─────────────────────────────────────────────────
export const employeeAPI = {
  list:     (params?: Record<string, any>) => api.get('/employees/', { params }),
  dropdown: () => api.get('/employees/dropdown/'),
  get:      (id: number) => api.get(`/employees/${id}/`),
  stats:    (id: number) => api.get(`/employees/${id}/stats/`),
  create:   (data: any)  => api.post('/employees/', data),
  update:   (id: number, data: any) => api.patch(`/employees/${id}/`, data),
  delete:   (id: number) => api.delete(`/employees/${id}/`),
};

// ── Attendance ────────────────────────────────────────────────
export const attendanceAPI = {
  list:           (params?: Record<string, any>) => api.get('/attendance/', { params }),
  bulkMark:       (data: { date: string; records: any[] }) =>
                    api.post('/attendance/bulk/', data),
  monthlySummary: (year: number, month: number) =>
                    api.get('/attendance/monthly-summary/', { params: { year, month } }),
};

// ── Production ────────────────────────────────────────────────
export const productionAPI = {
  list:          (params?: Record<string, any>) => api.get('/production/', { params }),
  create:        (data: any)  => api.post('/production/', data),
  update:        (id: number, data: any) => api.patch(`/production/${id}/`, data),
  delete:        (id: number) => api.delete(`/production/${id}/`),
  summary:       (period: string, employee_id?: number) =>
                   api.get('/production/summary/', { params: { period, employee_id } }),
  defects:       () => api.get('/production/defects/'),
  topPerformers: () => api.get('/production/top-performers/'),
  dailyChart:    (days?: number) => api.get('/production/daily-chart/', { params: { days } }),
  designs:       () => api.get('/production/designs/'),
  pricing:       () => api.get('/production/pricing/'),
};

// ── Salary ────────────────────────────────────────────────────

export const salaryAPI = {
  list:            (params?: Record<string, any>) => api.get('/salary/', { params }),
  weeklySummary:   () => api.get('/salary/weekly-summary/'),

  // New: week summary for any date
  weekSummary: (date: string) =>
    api.get('/salary/week-summary/', { params: { date } }),

  calculate:       () => api.post('/salary/calculate/'),

  markPaid: (id: number, payment_method = 'Cash') =>
    api.patch(`/salary/${id}/mark-paid/`, { payment_method }),

  // New: credit-card style partial payment
  addPayment: (
    id: number,
    data: { amount: number; payment_method: string; notes?: string; paid_on: string }
  ) => api.post(`/salary/${id}/add-payment/`, data),

  // New: download payslip PDF (returns blob)
  downloadPayslip: (id: number) =>
    api.get(`/salary/${id}/download-payslip/`, { responseType: 'blob' }),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary/'),
};
