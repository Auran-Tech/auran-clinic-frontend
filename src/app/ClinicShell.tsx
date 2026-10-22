import './ClinicShell.css'
import { useState, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../features/auth/AuthContext'
import { getClinicSettings } from '../features/settings/api'
import type { resources } from '../translations'

interface NavItem {
  to: string
  label: keyof typeof resources.en.common
  permission: string
  icon: keyof typeof iconPaths
}

const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  patients: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
      <path d="M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5" />
    </>
  ),
  queue: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  pending: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 12h7M9 16h7" />
    </>
  ),
  followUps: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V9h4v11M10 20V4h4v16M16 20v-7h4v7M3 20h18" />
    </>
  ),
  employees: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 8h5M18.5 5.5v5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M10 2h4l.5 2.2 2 .8 1.9-1.2 2.8 2.8L20 8.5l.8 2L23 11v4l-2.2.5-.8 2 1.2 1.9-2.8 2.8-1.9-1.2-2 .8L14 23h-4l-.5-2.2-2-.8-1.9 1.2-2.8-2.8L4 16.5l-.8-2L1 14v-4l2.2-.5.8-2-1.2-1.9 2.8-2.8L7.5 5l2-.8z" />
    </>
  ),
  audit: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
}

const sections: { title: 'workspace' | 'administration'; items: NavItem[] }[] = [
  {
    title: 'workspace',
    items: [
      {
        to: '/dashboard',
        label: 'dashboard',
        permission: 'Reports_View',
        icon: 'dashboard',
      },
      {
        to: '/patients',
        label: 'patients',
        permission: 'Patient_View',
        icon: 'patients',
      },
      { to: '/queue', label: 'queue', permission: 'Queue_View', icon: 'queue' },
      {
        to: '/pending-documentation',
        label: 'pendingDocumentation',
        permission: 'Visit_View',
        icon: 'pending',
      },
      {
        to: '/follow-ups',
        label: 'followUps',
        permission: 'FollowUp_View',
        icon: 'followUps',
      },
      { to: '/reports', label: 'reports', permission: 'Reports_View', icon: 'reports' },
    ],
  },
  {
    title: 'administration',
    items: [
      {
        to: '/employees',
        label: 'employees',
        permission: 'Users_View',
        icon: 'employees',
      },
      {
        to: '/settings',
        label: 'settings',
        permission: 'Settings_View',
        icon: 'settings',
      },
      { to: '/audit', label: 'audit', permission: 'Audit_View', icon: 'audit' },
    ],
  },
]

export function ClinicShell({ children }: PropsWithChildren) {
  const auth = useAuth()
  const { t } = useTranslation(['shell', 'common'])
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = auth.session!.user
  const clinicSettings = useQuery({
    queryKey: ['clinic-settings', user.clinicId],
    queryFn: getClinicSettings,
    enabled: auth.hasPermission('Settings_View'),
    staleTime: 300_000,
  })
  const currentPage = sections
    .flatMap((section) => section.items)
    .find(
      (item) =>
        location.pathname === item.to || location.pathname.startsWith(item.to + '/'),
    )

  return (
    <div className="clinic-layout">
      {menuOpen && (
        <button
          className="clinic-nav-scrim"
          aria-label={t('shell:closeMenu')}
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`clinic-sidebar${menuOpen ? ' is-open' : ''}`}
        aria-label={t('shell:navigation')}
      >
        <NavLink
          to="/dashboard"
          className="sidebar-brand"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span className="sidebar-brand-text">
            AURAN <small>CLINIC</small>
          </span>
        </NavLink>
        <div className="sidebar-clinic">
          <span className="sidebar-clinic-avatar" aria-hidden="true">
            ✦
          </span>
          <span>
            <strong>{clinicSettings.data?.clinicName || 'Auran Clinic'}</strong>
            <small>{t('shell:workspace')}</small>
          </span>
        </div>
        <nav className="clinic-nav">
          {sections.map((section) => {
            const visible = section.items.filter((item) =>
              auth.hasPermission(item.permission),
            )
            if (!visible.length) return null
            return (
              <div className="clinic-nav-section" key={section.title}>
                <p className="clinic-nav-heading">{t(`shell:${section.title}`)}</p>
                {visible.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `clinic-nav-link${isActive ? ' active' : ''}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg
                      className="clinic-nav-icon"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {iconPaths[item.icon]}
                    </svg>
                    <span>{t(`common:${item.label}`)}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
        <div className="sidebar-user">
          <span className="sidebar-user-avatar" aria-hidden="true">
            {user.fullName.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{user.fullName}</strong>
            <small>{user.roles.join(', ') || t('shell:staff')}</small>
          </span>
        </div>
      </aside>
      <div className="clinic-main">
        <header className="clinic-topbar">
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={t('shell:openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            ☰
          </button>
          <div className="topbar-context">
            <span>{t('shell:workspace')}</span>
            <strong>
              {currentPage ? t(`common:${currentPage.label}`) : t('common:patients')}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-user">{user.fullName}</span>
            <button
              className="topbar-signout"
              type="button"
              onClick={() => void auth.signOut()}
            >
              {t('shell:signOut')}
            </button>
          </div>
        </header>
        <div className="clinic-content">{children}</div>
      </div>
    </div>
  )
}
