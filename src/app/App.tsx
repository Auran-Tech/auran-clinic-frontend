import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
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

function Placeholder({ title }: { title: string }) {
  return <section className="page"><header className="page-heading"><div><h1>{title}</h1><p>Planned in MVP 1.</p></div></header><div className="card state-card">Implementation follows the approved prototype and backend contract.</div></section>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/patients" replace />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/profile" element={<PatientProfilePage />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/visits" element={<VisitsPage />} />
        <Route path="/visits/workspace" element={<VisitWorkspacePage />} />
        <Route path="/follow-ups" element={<FollowUpsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  );
}
