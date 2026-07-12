import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import RequestsPage from './pages/RequestsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import OrgSetupPage from './pages/OrgSetupPage';
import BookingsPage from './pages/BookingsPage';
import MaintenancePage from './pages/MaintenancePage';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';
import LogsNotificationsPage from './pages/LogsNotificationsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="assets/:id" element={<AssetDetailPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="org-setup" element={<OrgSetupPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="audits" element={<AuditPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="activity" element={<LogsNotificationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
