import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { authSession } from "../features/auth/authSession";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Patients", "/patients"],
  ["Live Queue", "/queue"],
  ["Visits", "/visits"],
  ["Follow-ups", "/follow-ups"],
  ["Reports", "/reports"],
  ["Employees", "/employees"],
  ["Roles & Permissions", "/roles"],
  ["Settings", "/settings"],
  ["Audit Log", "/audit"]
] as const;

export function AppShell() {
  const session = authSession.get();
  const [drawer, setDrawer] = useState(false);

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className={`app-layout ${drawer ? "drawer-open" : ""}`}>
      <button className="drawer-overlay" aria-label="Close menu" onClick={() => setDrawer(false)} />

      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>A</span>
          <div><strong>AURAN</strong><small>Clinic Management</small></div>
        </div>
        <nav>
          {nav.map(([label, path]) => (
            <NavLink key={path} to={path} onClick={() => setDrawer(false)}>{label}</NavLink>
          ))}
        </nav>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <button className="icon-button" onClick={() => setDrawer(value => !value)} aria-label="Toggle menu"><Menu size={19} /></button>
          <div className="global-search"><Search size={16} /><input placeholder="Search patient, visit, or report..." /></div>
          <div className="topbar-actions">
            <button className="branch-button"><span>Main Clinic</span><ChevronDown size={15} /></button>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
            <div className="avatar">{session.user.fullName.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase()}</div>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
