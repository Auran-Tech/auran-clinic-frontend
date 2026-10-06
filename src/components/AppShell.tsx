import { Bell, ChevronDown, Languages, Menu, Search } from "lucide-react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { authSession } from "../features/auth/authSession";
import { useI18n } from "../lib/i18n/i18n";

const nav = [
  ["Dashboard", "لوحة التحكم", "/dashboard", "Dashboard_View"],
  ["Patients", "المرضى", "/patients", "Patient_View"],
  ["Live Queue", "قائمة الانتظار", "/queue", "Queue_View"],
  ["Visits", "الزيارات", "/visits", "Visit_View"],
  ["Follow-ups", "المتابعات", "/follow-ups", "FollowUp_View"],
  ["Reports", "التقارير", "/reports", "Reports_View"],
  ["Employees", "الموظفون", "/employees", "Users_View"],
  ["Roles & Permissions", "الأدوار والصلاحيات", "/roles", "RBAC_View"],
  ["Settings", "الإعدادات", "/settings", "Settings_View"],
  ["Audit Log", "سجل التدقيق", "/audit", "Audit_View"]
] as const;

export function AppShell() {
  const session = authSession.get();
  const [drawer, setDrawer] = useState(false);
  const { locale, toggleLocale, t } = useI18n();

  if (!session) return <Navigate to="/login" replace />;

  const allowedNav = nav.filter(([, , , permission]) => authSession.hasPermission(permission));

  return (
    <div className={`app-layout ${drawer ? "drawer-open" : ""}`}>
      <button className="drawer-overlay" aria-label={t("Close menu", "إغلاق القائمة")} onClick={() => setDrawer(false)} />

      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>A</span>
          <div><strong>AURAN</strong><small>{t("Clinic Management", "إدارة العيادة")}</small></div>
        </div>
        <nav>
          {allowedNav.map(([english, arabic, path]) => (
            <NavLink key={path} to={path} onClick={() => setDrawer(false)}>{t(english, arabic)}</NavLink>
          ))}
        </nav>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <button className="icon-button" onClick={() => setDrawer(value => !value)} aria-label={t("Toggle menu", "فتح أو إغلاق القائمة")}><Menu size={19} /></button>
          <div className="global-search"><Search size={16} /><input placeholder={t("Search patient, visit, or report...", "ابحث عن مريض أو زيارة أو تقرير...")} /></div>
          <div className="topbar-actions">
            <button className="branch-button"><span>{t("Main Clinic", "العيادة الرئيسية")}</span><ChevronDown size={15} /></button>
            <button className="icon-button" onClick={toggleLocale} aria-label={t("Switch language", "تغيير اللغة")} title={locale === "ar" ? "English" : "العربية"}><Languages size={18} /></button>
            <button className="icon-button" aria-label={t("Notifications", "الإشعارات")}><Bell size={18} /></button>
            <div className="avatar">{session.user.fullName.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase()}</div>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
