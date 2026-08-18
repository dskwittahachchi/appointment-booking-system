import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout, PublicLayout, RequireRole } from "./components/AppShell";
import AdminDashboard from "./pages/AdminDashboard";
import AppointmentsPage from "./pages/AppointmentsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import BookingPage from "./pages/BookingPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProviderDashboard from "./pages/ProviderDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route path="login" element={<LoginPage />} />

      <Route element={<RequireRole roles={["customer"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="app" element={<CustomerDashboard />} />
          <Route path="app/appointments" element={<AppointmentsPage />} />
          <Route path="app/book" element={<BookingPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={["provider"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="provider" element={<ProviderDashboard />} />
          <Route path="provider/appointments" element={<ProviderDashboard />} />
          <Route path="provider/availability" element={<AvailabilityPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/services" element={<AdminDashboard />} />
          <Route path="admin/users" element={<ComingSoonPage title="People management" />} />
          <Route path="admin/settings" element={<ComingSoonPage title="Platform settings" />} />
        </Route>
      </Route>

      <Route path="home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
