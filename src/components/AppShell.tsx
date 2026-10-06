import { Languages, LogOut, Menu, Search, UserRound } from "lucide-react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { FormEvent, useState } from "react";
import { api } from "../lib/api/client";
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

const patientSearchKey = "auran.clinic.patient-search";

export function AppShell() {
  const session = authSession.get();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const { locale, toggleLocale, t } = useI18n();

  if (!session) return <Navigate to="/login" replace />;

  const allowedNav = nav.filter(([, , , permission]) => authSession.hasPermission(permission));

  function submitQuickSearch(event: FormEvent) {
    event.preventDefault();
    const value = quickSearch.trim();
    if (!value) return;
    sessionStorage.setItem(patientSearchKey, value);
    navigate("/patients");
    setQuickSearch("");
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/auth/logout", { refreshToken: session.refreshToken });
    } catch {
      // Local sign-out still proceeds if the network/API is unavailable.
    } finally {
      authSession.set(null);
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  }

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

          {authSession.hasPermission("Patient_View") ? (
            <form className="global-search" onSubmit={submitQuickSearch}>
              <Search size={16} />
              <input
                value={quickSearch}
                onChange={event => setQuickSearch(event.target.value)}
                placeholder={t("Quick patient search...", "بحث سريع عن مريض...")}
                aria-label={t("Quick patient search", "بحث سريع عن مريض")}
              />
            </form>
          ) : <div className="topbar-spacer" />}

          <div className="topbar-actions">
            <button className="icon-button" onClick={toggleLocale} aria-label={t("Switch language", "تغيير اللغة")} title={locale === "ar" ? "English" : "العربية"}><Languages size={18} /></button>
            <div className="user-menu-wrap">
              <button className="avatar avatar-button" onClick={() => setUserMenu(value => !value)} aria-label={t("Open user menu", "فتح قائمة المستخدم")}>
                {session.user.fullName.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase()}
              </button>
              {userMenu && (
                <div className="user-menu">
                  <div className="user-menu-head">
                    <UserRound size={17} />
                    <div><strong>{session.user.fullName}</strong><small>{session.user.email ?? ""}</small></div>
                  </div>
                  <button onClick={logout} disabled={loggingOut}><LogOut size={15} />{loggingOut ? t("Signing out...", "جارٍ تسجيل الخروج...") : t("Sign out", "تسجيل الخروج")}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
