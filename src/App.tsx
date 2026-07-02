import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { Features } from "@/pages/landing/Features";
import Docs from "@/pages/landing/Docs";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import PortsPage from "@/pages/PortsPage";
import LogsPage from "@/pages/LogsPage";
import AIInsightsPage from "@/pages/AIInsightsPage";
import SettingsPage from "@/pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Features />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cli-login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="ports" element={<PortsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="ai-insights" element={<AIInsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
