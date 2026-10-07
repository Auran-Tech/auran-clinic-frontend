import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
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
import type { Employee } from './types'

export function EmployeesPage() {
  const auth = useAuth()
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
        permission.descriptions.en ?? permission.descriptions.ar ?? permission.key,
      )
    }
    return map
  }, [permissionsQuery.data])

  if (!canViewUsers && !canViewRbac) {
    return (
      <main className="page-shell">
        <p className="state error">You do not have permission to view employee administration.</p>
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
          <p className="eyebrow">Administration</p>
          <h1>Employees & RBAC</h1>
          <p className="muted">
            Manage clinic staff accounts and assign protected system roles.
          </p>
        </div>
        <div className="actions">
          <Link className="button secondary nav-button" to="/follow-ups">Follow-ups</Link>
          <Link className="button secondary nav-button" to="/queue">Live queue</Link>
          <Link className="button secondary nav-button" to="/patients">Patients</Link>
        </div>
      </section>

      {canManageUsers && canManageRbac && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Create employee</h2>
              <p className="muted">Normal employees require at least one protected system role.</p>
            </div>
          </div>

          <div className="employee-form">
            <label>
              <span>Full name</span>
              <input value={createName} onChange={(event) => setCreateName(event.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={createEmail} onChange={(event) => setCreateEmail(event.target.value)} />
            </label>
            <label>
              <span>Phone</span>
              <input value={createPhone} onChange={(event) => setCreatePhone(event.target.value)} />
            </label>
            <label>
              <span>Temporary password</span>
              <input type="password" value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} />
            </label>

            {auth.session?.user.isSuperUser && (
              <label className="inline-toggle full-width">
                <input
                  type="checkbox"
                  checked={createSuperUser}
                  onChange={(event) => setCreateSuperUser(event.target.checked)}
                />
                <span>Create as Clinic Super User</span>
              </label>
            )}

            <div className="full-width">
              <span className="form-section-label">System roles</span>
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
                {createMutation.isPending ? 'Creating…' : 'Create employee'}
              </button>
            </div>

            {createMutation.isError && (
              <p className="field-error full-width">
                Unable to create employee. Check email uniqueness, password requirements, and role selection.
              </p>
            )}
          </div>
        </section>
      )}

      {canViewUsers && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Clinic employees</h2>
              <p className="muted">Account status and assigned roles are enforced by the backend.</p>
            </div>
          </div>

          {employeesQuery.isLoading && <p className="state">Loading employees…</p>}
          {employeesQuery.isError && <p className="state error">Unable to load employees.</p>}

          {employeesQuery.data && employeesQuery.data.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Super User</th>
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
                      <td>{employee.isActive ? 'Active' : 'Inactive'}</td>
                      <td>{employee.isSuperUser ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          className="button secondary"
                          onClick={() => setSelectedId(
                            selectedId === employee.id ? null : employee.id,
                          )}
                        >
                          {selectedId === employee.id ? 'Close' : 'Manage'}
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
              <h2>Manage {selectedEmployee.fullName}</h2>
              <p className="muted">
                {selectedEmployee.isSuperUser
                  ? 'Protected Clinic Super User'
                  : 'Clinic employee account'}
              </p>
            </div>
          </div>

          {canManageUsers && (
            <div className="employee-form">
              <label>
                <span>Full name</span>
                <input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
              </label>
              <label>
                <span>Phone</span>
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
                  {updateMutation.isPending ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </div>
          )}

          {canManageRbac && !selectedEmployee.isSuperUser && (
            <div className="employee-section">
              <span className="form-section-label">Assigned system roles</span>
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
                  {rolesMutation.isPending ? 'Saving roles…' : 'Save roles'}
                </button>
              </div>
            </div>
          )}

          {canManageStatus && (
            <div className="employee-section">
              <span className="form-section-label">Account status</span>
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
                    ? 'Updating…'
                    : selectedEmployee.isActive
                      ? 'Deactivate employee'
                      : 'Activate employee'}
                </button>
              </div>
            </div>
          )}

          {(updateMutation.isError || rolesMutation.isError || statusMutation.isError) && (
            <p className="field-error">
              Unable to apply this employee change. Protected Super User and last-Super-User rules may apply.
            </p>
          )}
        </section>
      )}

      {canViewRbac && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Protected role matrix</h2>
              <p className="muted">
                Role definitions and built-in permissions are backend-owned and read-only in V1.
              </p>
            </div>
          </div>

          {rolesQuery.isLoading && <p className="state">Loading roles…</p>}
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
