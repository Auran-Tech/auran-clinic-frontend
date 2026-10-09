import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  createEmployee,
  getEmployees,
  getPermissionCatalog,
  getSystemRoles,
  setEmployeeRoles,
  setEmployeeStatus,
  updateEmployee,
} from './api'

export function EmployeesPage() {
  const auth = useAuth()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const canViewUsers = auth.hasPermission('Users_View')
  const canManageUsers = auth.hasPermission('Users_Manage')
  const canManageStatus = auth.hasPermission('Users_Manage_Status')
  const canViewRbac = auth.hasPermission('RBAC_View')
  const canManageRbac = auth.hasPermission('RBAC_Manage')

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    enabled: canViewUsers,
  })

  const rolesQuery = useQuery({
    queryKey: ['system-roles'],
    queryFn: getSystemRoles,
    enabled: canViewRbac || canManageRbac,
  })

  const permissionsQuery = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: getPermissionCatalog,
    enabled: canViewRbac,
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedEmployee = useMemo(
    () => employeesQuery.data?.find((employee) => employee.id === selectedId) ?? null,
    [employeesQuery.data, selectedId],
  )

  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createSuperUser, setCreateSuperUser] = useState(false)
  const [createRoles, setCreateRoles] = useState<string[]>([])

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRoles, setEditRoles] = useState<string[]>([])

  useEffect(() => {
    if (!selectedEmployee) return
    setEditName(selectedEmployee.fullName)
    setEditEmail(selectedEmployee.email ?? '')
    setEditPhone(selectedEmployee.phone ?? '')
    setEditRoles(selectedEmployee.roles)
  }, [selectedEmployee])

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: async () => {
      setCreateName('')
      setCreateEmail('')
      setCreatePhone('')
      setCreatePassword('')
      setCreateSuperUser(false)
      setCreateRoles([])
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const rolesMutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      setEmployeeRoles(userId, roles),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      setEmployeeStatus(userId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const roleDescriptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const permission of permissionsQuery.data ?? []) {
      map.set(
        permission.key,
        i18n.resolvedLanguage === 'ar'
          ? permission.descriptions.ar ?? permission.descriptions.en ?? permission.key
          : permission.descriptions.en ?? permission.descriptions.ar ?? permission.key,
      )
    }
    return map
  }, [permissionsQuery.data, i18n.resolvedLanguage])

  if (!canViewUsers && !canViewRbac) {
    return (
      <main className="page-shell">
        <p className="state error">{t('employeesPage.denied')}</p>
      </main>
    )
  }

  const toggleRole = (
    code: string,
    roles: string[],
    setter: (value: string[]) => void,
  ) => {
    setter(
      roles.includes(code)
        ? roles.filter((role) => role !== code)
        : [...roles, code],
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('employeesPage.eyebrow')}</p>
          <h1>{t('employeesPage.title')}</h1>
          <p className="muted">
            {t('employeesPage.intro')}
          </p>
        </div>
        <div className="actions">
          {auth.hasPermission('Audit_View') && (
            <Link className="button secondary nav-button" to="/audit">{t('common.audit')}</Link>
          )}
          {auth.hasPermission('Settings_View') && (
            <Link className="button secondary nav-button" to="/settings">{t('common.settings')}</Link>
          )}
          <Link className="button secondary nav-button" to="/follow-ups">{t('common.followUps')}</Link>
          <Link className="button secondary nav-button" to="/queue">{t('common.queue')}</Link>
          <Link className="button secondary nav-button" to="/patients">{t('common.patients')}</Link>
        </div>
      </section>

      {canManageUsers && canManageRbac && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('employeesPage.createTitle')}</h2>
              <p className="muted">{t('employeesPage.createIntro')}</p>
            </div>
          </div>

          <div className="employee-form">
            <label>
              <span>{t('employeesPage.fullName')}</span>
              <input value={createName} onChange={(event) => setCreateName(event.target.value)} />
            </label>
            <label>
              <span>{t('employeesPage.email')}</span>
              <input type="email" value={createEmail} onChange={(event) => setCreateEmail(event.target.value)} />
            </label>
            <label>
              <span>{t('employeesPage.phone')}</span>
              <input value={createPhone} onChange={(event) => setCreatePhone(event.target.value)} />
            </label>
            <label>
              <span>{t('employeesPage.temporaryPassword')}</span>
              <input type="password" value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} />
            </label>

            {auth.session?.user.isSuperUser && (
              <label className="inline-toggle full-width">
                <input
                  type="checkbox"
                  checked={createSuperUser}
                  onChange={(event) => setCreateSuperUser(event.target.checked)}
                />
                <span>{t('employeesPage.createSuperUser')}</span>
              </label>
            )}

            <div className="full-width">
              <span className="form-section-label">{t('employeesPage.systemRoles')}</span>
              <div className="role-choice-grid">
                {(rolesQuery.data ?? []).map((role) => (
                  <label className="role-choice" key={role.code}>
                    <input
                      type="checkbox"
                      checked={createRoles.includes(role.code)}
                      onChange={() => toggleRole(role.code, createRoles, setCreateRoles)}
                    />
                    <span>
                      <strong>{role.name}</strong>
                      <small>{role.code}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="actions full-width">
              <button
                className="button primary"
                disabled={
                  createMutation.isPending ||
                  !createName.trim() ||
                  !createEmail.trim() ||
                  !createPassword ||
                  (!createSuperUser && createRoles.length === 0)
                }
                onClick={() =>
                  createMutation.mutate({
                    fullName: createName.trim(),
                    email: createEmail.trim(),
                    password: createPassword,
                    phone: createPhone.trim() || undefined,
                    isSuperUser: createSuperUser,
                    roles: createRoles,
                  })
                }
              >
                {createMutation.isPending ? t('employeesPage.creating') : t('employeesPage.create')}
              </button>
            </div>

            {createMutation.isError && (
              <p className="field-error full-width">
                {t('employeesPage.createError')}
              </p>
            )}
          </div>
        </section>
      )}

      {canViewUsers && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('employeesPage.clinicEmployees')}</h2>
              <p className="muted">{t('employeesPage.employeesIntro')}</p>
            </div>
          </div>

          {employeesQuery.isLoading && <p className="state">{t('employeesPage.loading')}</p>}
          {employeesQuery.isError && <p className="state error">{t('employeesPage.loadError')}</p>}

          {employeesQuery.data && employeesQuery.data.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('employeesPage.employee')}</th>
                    <th>{t('employeesPage.roles')}</th>
                    <th>{t('employeesPage.status')}</th>
                    <th>{t('employeesPage.superUser')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {employeesQuery.data.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong>{employee.fullName}</strong>
                        <div className="muted">{employee.email ?? '—'}</div>
                      </td>
                      <td>
                        <div className="role-badges">
                          {employee.roles.map((role) => (
                            <span className="role-badge" key={role}>{role}</span>
                          ))}
                        </div>
                      </td>
                      <td>{employee.isActive ? t('employeesPage.active') : t('employeesPage.inactive')}</td>
                      <td>{employee.isSuperUser ? t('employeesPage.yes') : t('employeesPage.no')}</td>
                      <td>
                        <button
                          className="button secondary"
                          onClick={() => setSelectedId(
                            selectedId === employee.id ? null : employee.id,
                          )}
                        >
                          {selectedId === employee.id ? t('employeesPage.close') : t('employeesPage.manage')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {selectedEmployee && (
        <section className="panel employee-manager">
          <div className="panel-heading">
            <div>
              <h2>{t('employeesPage.manageName', { name: selectedEmployee.fullName })}</h2>
              <p className="muted">
                {selectedEmployee.isSuperUser
                  ? t('employeesPage.protectedSuperUser')
                  : t('employeesPage.clinicEmployeeAccount')}
              </p>
            </div>
          </div>

          {canManageUsers && (
            <div className="employee-form">
              <label>
                <span>{t('employeesPage.fullName')}</span>
                <input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </label>
              <label>
                <span>{t('employeesPage.email')}</span>
                <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
              </label>
              <label>
                <span>{t('employeesPage.phone')}</span>
                <input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
              </label>
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={updateMutation.isPending || !editName.trim() || !editEmail.trim()}
                  onClick={() =>
                    updateMutation.mutate({
                      userId: selectedEmployee.id,
                      fullName: editName.trim(),
                      email: editEmail.trim(),
                      phone: editPhone.trim() || undefined,
                    })
                  }
                >
                  {updateMutation.isPending ? t('employeesPage.saving') : t('employeesPage.saveProfile')}
                </button>
              </div>
            </div>
          )}

          {canManageRbac && !selectedEmployee.isSuperUser && (
            <div className="employee-section">
              <span className="form-section-label">{t('employeesPage.assignedRoles')}</span>
              <div className="role-choice-grid">
                {(rolesQuery.data ?? []).map((role) => (
                  <label className="role-choice" key={role.code}>
                    <input
                      type="checkbox"
                      checked={editRoles.includes(role.code)}
                      onChange={() => toggleRole(role.code, editRoles, setEditRoles)}
                    />
                    <span>
                      <strong>{role.name}</strong>
                      <small>{role.code}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={rolesMutation.isPending || editRoles.length === 0}
                  onClick={() =>
                    rolesMutation.mutate({
                      userId: selectedEmployee.id,
                      roles: editRoles,
                    })
                  }
                >
                  {rolesMutation.isPending ? t('employeesPage.savingRoles') : t('employeesPage.saveRoles')}
                </button>
              </div>
            </div>
          )}

          {canManageStatus && (
            <div className="employee-section">
              <span className="form-section-label">{t('employeesPage.accountStatus')}</span>
              <div className="actions">
                <button
                  className={`button ${selectedEmployee.isActive ? 'danger' : 'secondary'}`}
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      userId: selectedEmployee.id,
                      isActive: !selectedEmployee.isActive,
                    })
                  }
                >
                  {statusMutation.isPending
                    ? t('employeesPage.updating')
                    : selectedEmployee.isActive
                      ? t('employeesPage.deactivate')
                      : t('employeesPage.activate')}
                </button>
              </div>
            </div>
          )}

          {(updateMutation.isError || rolesMutation.isError || statusMutation.isError) && (
            <p className="field-error">
              {t('employeesPage.changeError')}
            </p>
          )}
        </section>
      )}

      {canViewRbac && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('employeesPage.matrixTitle')}</h2>
              <p className="muted">
                {t('employeesPage.matrixIntro')}
              </p>
            </div>
          </div>

          {rolesQuery.isLoading && <p className="state">{t('employeesPage.loadingRoles')}</p>}
          {rolesQuery.data && (
            <div className="role-matrix">
              {rolesQuery.data.map((role) => (
                <article className="role-card" key={role.code}>
                  <div>
                    <h3>{role.name}</h3>
                    <p className="muted mono">{role.code}</p>
                  </div>
                  <ul>
                    {role.permissions.map((permission) => (
                      <li key={permission}>
                        <strong>{permission}</strong>
                        <span>{roleDescriptions.get(permission) ?? ''}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
