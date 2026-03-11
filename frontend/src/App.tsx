import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { useAuthStore } from "./store/authStore";
import LoadingScreen from "./components/common/LoadingScreen";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const EmployeePage = lazy(() => import("./pages/employee/EmployeePage"));
const AttendancePage = lazy(() => import("./pages/attendance/AttendancePage"));
const ProductionPage = lazy(() => import("./pages/production/ProductionPage"));
const SalaryPage = lazy(() => import("./pages/salary/SalaryPage"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, init } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    init().finally(() => setInitialized(true));
  }, [init]);

  if (!initialized) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/"
            element={
              <Protected>
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="employees" element={<EmployeePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
