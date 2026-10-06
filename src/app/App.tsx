import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { authSession, useAuthSession } from "../features/auth/authSession";
import { useI18n } from "../lib/i18n/i18n";
import { PatientsPage } from "../features/patients/PatientsPage";
import { PatientProfilePage } from "../features/patients/PatientProfilePage";
import { QueuePage } from "../features/queue/QueuePage";
import { VisitsPage } from "../features/visits/VisitsPage";
import { VisitWorkspacePage } from "../features/visits/VisitWorkspacePage";
import { FollowUpsPage } from "../features/followups/FollowUpsPage";
import { EmployeesPage } from "../features/admin/EmployeesPage";
import { RolesPage } from "../features/admin/RolesPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { AuditPage } from "../features/audit/AuditPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";

function RequirePermission({ permission, children }: { permission: string; children: ReactElement }) {
  const { t } = useI18n();
  const session = useAuthSession();
  if (!session) return <Navigate to="/login" replace />;
  if (!authSession.hasPermission(permission)) {
    return <section className="page"><div className="card state-card error-box">{t("You do not have permission to access this page.", "ليس لديك صلاحية للوصول إلى هذه الصفحة.")}</div></section>;
  }
  return children;
}

const protect = (permission: string, element: ReactElement) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={protect("Dashboard_View", <DashboardPage />)} />
        <Route path="/patients" element={protect("Patient_View", <PatientsPage />)} />
        <Route path="/patients/profile" element={protect("MedicalProfile_View", <PatientProfilePage />)} />
        <Route path="/queue" element={protect("Queue_View", <QueuePage />)} />
        <Route path="/visits" element={protect("Visit_View", <VisitsPage />)} />
        <Route path="/visits/workspace" element={protect("Visit_View", <VisitWorkspacePage />)} />
        <Route path="/follow-ups" element={protect("FollowUp_View", <FollowUpsPage />)} />
        <Route path="/reports" element={protect("Reports_View", <ReportsPage />)} />
        <Route path="/employees" element={protect("Users_View", <EmployeesPage />)} />
        <Route path="/roles" element={protect("RBAC_View", <RolesPage />)} />
        <Route path="/settings" element={protect("Settings_View", <SettingsPage />)} />
        <Route path="/audit" element={protect("Audit_View", <AuditPage />)} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
