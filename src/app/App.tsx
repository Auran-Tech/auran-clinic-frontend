import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { PatientsPage } from "../features/patients/PatientsPage";

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
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="/queue" element={<Placeholder title="Live Queue" />} />
        <Route path="/visits" element={<Placeholder title="Visits" />} />
        <Route path="/follow-ups" element={<Placeholder title="Follow-ups" />} />
        <Route path="/reports" element={<Placeholder title="Reports" />} />
        <Route path="/employees" element={<Placeholder title="Employees" />} />
        <Route path="/roles" element={<Placeholder title="Roles & Permissions" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
        <Route path="/audit" element={<Placeholder title="Audit Log" />} />
      </Route>
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  );
}
