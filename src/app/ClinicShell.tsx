import './ClinicShell.css'
import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  Building2,
  ChartNoAxesColumn,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  ListTodo,
  Menu,
  Moon,
  Search,
  Settings,
  UserRoundPlus,
  UsersRound,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { getClinicSettings } from '../features/settings/api'
import { getActiveQueue } from '../features/queue/api'
import { LocaleController } from './LocaleController'
import { useTheme } from './themeState'
import type { resources } from '../translations'
import { useProfilePhoto } from '../features/profile/useProfilePhoto'

interface NavItem {
  to: string
  label: keyof typeof resources.en.common
  permission: string
  icon: keyof typeof navIcons
}

const navIcons = {
  dashboard: LayoutDashboard,
  patients: UsersRound,
  queue: ListTodo,
  pending: FileText,
  followUps: Clock3,
  reports: ChartNoAxesColumn,
  employees: UserRoundPlus,
  settings: Settings,
  audit: ClipboardList,
}
const sections: {
  title: 'workspace' | 'clinical' | 'management' | 'system'
  items: NavItem[]
}[] = [
  {
    title: 'workspace',
    items: [
      {
        to: '/dashboard',
        label: 'dashboard',
        permission: 'Reports_View',
        icon: 'dashboard',
      },
    ],
  },
  {
    title: 'clinical',
    items: [
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
    ],
  },
  {
    title: 'management',
    items: [
      { to: '/reports', label: 'reports', permission: 'Reports_View', icon: 'reports' },
      {
        to: '/employees',
        label: 'employees',
        permission: 'Users_View',
        icon: 'employees',
      },
    ],
  },
  {
    title: 'system',
    items: [
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
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation(['shell', 'common'])
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const accountMenuRef = useRef<HTMLDetailsElement>(null)
  const isCompact =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 760px)').matches
  const user = auth.session!.user
  const { url: profilePhotoUrl } = useProfilePhoto(user.userId)
  const clinicSettings = useQuery({
    queryKey: ['clinic-settings', user.clinicId],
    queryFn: getClinicSettings,
    enabled: auth.hasPermission('Settings_View'),
    staleTime: 300_000,
  })
  const queue = useQuery({
    queryKey: ['active-queue'],
    queryFn: getActiveQueue,
    enabled: auth.hasPermission('Queue_View'),
    refetchInterval: 30_000,
  })
  const clinicName = clinicSettings.data?.clinicName || 'Auran Clinic'
  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  return (
    <div className={`clinic-layout${sidebarCollapsed ? ' is-collapsed' : ''}`}>
      {menuOpen && (
        <button
          className="clinic-nav-scrim"
          aria-label={t('shell:closeMenu')}
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        id="clinic-navigation"
        className={`clinic-sidebar${menuOpen ? ' is-open' : ''}`}
        aria-label={t('shell:navigation')}
      >
        <div className="sidebar-brand">
          <NavLink
            to="/dashboard"
            className="sidebar-brand-link"
            onClick={() => setMenuOpen(false)}
            title={clinicName}
          >
            <span className="brand-mark" aria-hidden="true">
              A
            </span>
            <span className="sidebar-brand-text">
              <strong>{clinicName}</strong>
              <small>{t('shell:clinicManagement')}</small>
            </span>
          </NavLink>
          <button
            className="mobile-sidebar-close"
            type="button"
            aria-label={t('shell:closeMenu')}
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
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
                {visible.map((item) => {
                  const Icon = navIcons[item.icon]
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={t(`common:${item.label}`)}
                      className={({ isActive }) =>
                        `clinic-nav-link${isActive ? ' active' : ''}`
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon
                        className="clinic-nav-icon"
                        aria-hidden="true"
                        strokeWidth={1.7}
                      />
                      <span className="clinic-nav-label">
                        {t(`common:${item.label}`)}
                      </span>
                      {item.icon === 'queue' && !!queue.data?.length && (
                        <span className="clinic-nav-count">{queue.data.length}</span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </aside>
      <div className="clinic-main">
        <header className="clinic-topbar">
          <div className="topbar-start">
            <button
              className="sidebar-toggle"
              type="button"
              aria-label={t('shell:toggleSidebar')}
              aria-controls="clinic-navigation"
              aria-expanded={isCompact ? menuOpen : !sidebarCollapsed}
              onClick={() => {
                if (isCompact) {
                  setMenuOpen((value) => !value)
                } else {
                  setSidebarCollapsed((value) => !value)
                }
              }}
            >
              <Menu aria-hidden="true" size={18} />
            </button>
          </div>
          {auth.hasPermission('Patient_View') && (
            <form
              className="topbar-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault()
                navigate(`/patients?search=${encodeURIComponent(quickSearch.trim())}`)
              }}
            >
              <Search aria-hidden="true" size={16} />
              <input
                ref={searchRef}
                aria-label={t('shell:searchPatients')}
                placeholder={t('shell:searchPatients')}
                value={quickSearch}
                onChange={(event) => setQuickSearch(event.target.value)}
              />
              <kbd>Ctrl K</kbd>
            </form>
          )}
          <div className="topbar-actions">
            <details className="topbar-location">
              <summary aria-label={t('shell:currentClinic')} title={clinicName}>
                <Building2 aria-hidden="true" size={16} />
                <span className="topbar-location-name">{clinicName}</span>
                <ChevronDown className="topbar-chevron" aria-hidden="true" size={20} />
              </summary>
              <div className="topbar-dropdown topbar-location-menu">
                <strong>{t('shell:currentClinic')}</strong>
                <span>{clinicName}</span>
              </div>
            </details>
            <details className="topbar-notifications">
              <summary aria-label={t('shell:notifications')}>
                <Bell aria-hidden="true" size={18} />
              </summary>
              <div className="topbar-dropdown topbar-notifications-menu">
                <strong>{t('shell:notifications')}</strong>
                <p>{t('shell:noNotifications')}</p>
              </div>
            </details>
            <details ref={accountMenuRef} className="topbar-account">
              <summary aria-label={t('shell:accountMenu')}>
                <span className="topbar-avatar" aria-hidden="true">
                  {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : initials}
                </span>
                <span className="topbar-account-copy">
                  <strong>{user.fullName}</strong>
                  <small>
                    {user.isSuperUser
                      ? t('shell:superUser')
                      : user.roles.join(', ') || t('shell:staff')}
                  </small>
                </span>
                <ChevronDown className="topbar-chevron" aria-hidden="true" size={20} />
              </summary>
              <div className="topbar-dropdown topbar-account-menu">
                <div className="topbar-account-heading">
                  <span className="topbar-avatar" aria-hidden="true">
                    {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : initials}
                  </span>
                  <span>
                    <strong>{user.fullName}</strong>
                    <small>{user.email || user.roles.join(', ')}</small>
                  </span>
                </div>
                <Link
                  className="topbar-profile-link"
                  to="/profile"
                  onClick={() => accountMenuRef.current?.removeAttribute('open')}
                >
                  <UserRound size={16} aria-hidden="true" />
                  {t('shell:profileSettings')}
                </Link>
                <div className="topbar-language-row">
                  <span>{t('shell:language')}</span>
                  <LocaleController mode="segmented" />
                </div>
                <button
                  type="button"
                  className="topbar-theme-row"
                  role="switch"
                  aria-checked={theme === 'dark'}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Moon size={16} aria-hidden="true" />
                  <span>{t('shell:darkMode')}</span>
                  <span className="topbar-theme-track" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => void auth.signOut()}>
                  {t('shell:signOut')}
                </button>
              </div>
            </details>
          </div>
        </header>
        <div className="clinic-content">{children}</div>
      </div>
    </div>
  )
}
