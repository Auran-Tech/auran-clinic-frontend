import './employees.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ListFilter, Plus } from 'lucide-react'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Checkbox } from 'primereact/checkbox'
import {
  DataTable,
  TablePagination,
  type DataTableColumn,
} from '../../components/ui/DataTable'
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
  const { t, i18n } = useTranslation('employees')
  const location = useLocation()
  const navigate = useNavigate()
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
  const [createOpen, setCreateOpen] = useState(false)
  const rolesOpen = location.pathname === '/roles' || !canViewUsers
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [draftSearch, setDraftSearch] = useState('')
  const [draftStatus, setDraftStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [sort, setSort] = useState<'nameAsc' | 'nameDesc' | 'emailAsc' | 'emailDesc'>(
    'nameAsc',
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
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
      setCreateOpen(false)
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
        i18n.language === 'ar'
          ? (permission.descriptions.ar ?? permission.descriptions.en ?? permission.key)
          : (permission.descriptions.en ?? permission.descriptions.ar ?? permission.key),
      )
    }
    return map
  }, [permissionsQuery.data, i18n.language])

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    const list = (employeesQuery.data ?? []).filter((employee) => {
      const matchesSearch =
        !term ||
        [employee.fullName, employee.email, employee.roles.join(' ')]
          .join(' ')
          .toLocaleLowerCase()
          .includes(term)
      const matchesStatus =
        status === 'all' || employee.isActive === (status === 'active')
      return matchesSearch && matchesStatus
    })
    const field = sort.startsWith('name') ? 'fullName' : 'email'
    const direction = sort.endsWith('Desc') ? -1 : 1
    return list.sort(
      (a, b) => direction * (a[field] ?? '').localeCompare(b[field] ?? '', i18n.language),
    )
  }, [employeesQuery.data, i18n.language, search, sort, status])
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )
  const filterCount = Number(Boolean(search.trim())) + Number(status !== 'all')
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('employee'),
      sortDirection:
        sort === 'nameAsc' ? 'ascending' : sort === 'nameDesc' ? 'descending' : 'none',
      onSort: () => setSort(sort === 'nameAsc' ? 'nameDesc' : 'nameAsc'),
    },
    {
      key: 'email',
      label: t('email'),
      sortDirection:
        sort === 'emailAsc' ? 'ascending' : sort === 'emailDesc' ? 'descending' : 'none',
      onSort: () => setSort(sort === 'emailAsc' ? 'emailDesc' : 'emailAsc'),
    },
    { key: 'roles', label: t('roles') },
    { key: 'status', label: t('status') },
    { key: 'actions', label: t('actions') },
  ]

  if (!canViewUsers && !canViewRbac) {
    return (
      <main className="page-shell">
        <p className="state error">{t('forbidden')}</p>
      </main>
    )
  }

  const toggleRole = (
    code: string,
    roles: string[],
    setter: (value: string[]) => void,
  ) => {
    setter(
      roles.includes(code) ? roles.filter((role) => role !== code) : [...roles, code],
    )
  }

  return (
    <main className="page-shell employees-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>{rolesOpen ? t('matrixTitle') : t('employeesTitle')}</h1>
          <p className="muted">{rolesOpen ? t('matrixSubtitle') : t('subtitle')}</p>
        </div>
        {!rolesOpen && canManageUsers && canManageRbac && (
          <button
            className="button primary"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
            {t('addUser')}
          </button>
        )}
      </section>

      <div className="employees-view-tabs" role="tablist" aria-label={t('title')}>
        {canViewUsers && (
          <button
            type="button"
            role="tab"
            aria-selected={!rolesOpen}
            className={rolesOpen ? 'button secondary' : 'button primary'}
            onClick={() => navigate('/employees')}
          >
            {t('listTitle')}
          </button>
        )}
        {canViewRbac && (
          <button
            type="button"
            role="tab"
            aria-selected={rolesOpen}
            className={rolesOpen ? 'button primary' : 'button secondary'}
            onClick={() => navigate('/roles')}
          >
            {t('matrixTitle')}
          </button>
        )}
      </div>

      {canManageUsers && canManageRbac && (
        <Dialog
          header={t('createTitle')}
          visible={createOpen}
          modal
          className="employees-dialog"
          onHide={() => setCreateOpen(false)}
        >
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{t('createTitle')}</h2>
                <p className="muted">{t('createSubtitle')}</p>
              </div>
            </div>

            <div className="employee-form">
              <label>
                <span>{t('fullName')}</span>
                <InputText
                  className="auran-prime-field"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                />
              </label>
              <label>
                <span>{t('email')}</span>
                <InputText
                  className="auran-prime-field"
                  type="email"
                  value={createEmail}
                  onChange={(event) => setCreateEmail(event.target.value)}
                />
              </label>
              <label>
                <span>{t('phone')}</span>
                <InputText
                  className="auran-prime-field"
                  value={createPhone}
                  onChange={(event) => setCreatePhone(event.target.value)}
                />
              </label>
              <label>
                <span>{t('temporaryPassword')}</span>
                <Password
                  className="auran-prime-field"
                  inputClassName="auran-prime-field"
                  feedback={false}
                  toggleMask
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                />
              </label>

              {auth.session?.user.isSuperUser && (
                <label className="inline-toggle full-width">
                  <Checkbox
                    inputId="employee-create-super-user"
                    checked={createSuperUser}
                    onChange={(event) => setCreateSuperUser(Boolean(event.checked))}
                  />
                  <span>{t('createSuperUser')}</span>
                </label>
              )}

              <div className="full-width">
                <span className="form-section-label">{t('systemRoles')}</span>
                <div className="role-choice-grid">
                  {(rolesQuery.data ?? []).map((role) => (
                    <label className="role-choice" key={role.code}>
                      <Checkbox
                        inputId={`employee-create-role-${role.code}`}
                        checked={createRoles.includes(role.code)}
                        onChange={() =>
                          toggleRole(role.code, createRoles, setCreateRoles)
                        }
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
                  {createMutation.isPending ? t('creating') : t('create')}
                </button>
              </div>

              {createMutation.isError && (
                <p className="field-error full-width">{t('createError')}</p>
              )}
            </div>
          </section>
        </Dialog>
      )}

      {canViewUsers && !rolesOpen && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('listTitle')}</h2>
              <p className="muted">{t('listSubtitle')}</p>
            </div>
            <div className="employees-list-actions">
              <span className="employees-count">
                {filteredEmployees.length} {t('users')}
              </span>
              {filterCount > 0 && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setStatus('all')
                    setPage(1)
                  }}
                >
                  {t('clearFilters')}
                </button>
              )}
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setDraftSearch(search)
                  setDraftStatus(status)
                  setFiltersOpen(true)
                }}
              >
                <ListFilter size={16} aria-hidden="true" />
                {t('filters')}
                {filterCount ? ` (${filterCount})` : ''}
              </button>
            </div>
          </div>

          {employeesQuery.isLoading && <p className="state">{t('loading')}</p>}
          {employeesQuery.isError && <p className="state error">{t('loadError')}</p>}

          {employeesQuery.isSuccess && filteredEmployees.length === 0 && (
            <p className="state">{t('empty')}</p>
          )}
          {visibleEmployees.length > 0 && (
            <DataTable columns={columns}>
              {visibleEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <strong>{employee.fullName}</strong>
                    {employee.isSuperUser && (
                      <span className="role-badge">{t('superUser')}</span>
                    )}
                  </td>
                  <td dir="ltr">{employee.email ?? '—'}</td>
                  <td>
                    <div className="role-badges">
                      {employee.roles.map((role) => (
                        <span className="role-badge" key={role}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`employees-status ${employee.isActive ? 'is-active' : 'is-inactive'}`}
                    >
                      {employee.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setSelectedId(employee.id)}
                    >
                      {t('manage')}
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          {employeesQuery.isSuccess && filteredEmployees.length > 0 && (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filteredEmployees.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              labels={{
                rowsPerPage: t('rowsPerPage'),
                previous: t('previousPage'),
                next: t('nextPage'),
                page: t('pageNumber', { page: currentPage, total: totalPages }),
                showing: t('showingRows', {
                  first: (currentPage - 1) * pageSize + 1,
                  last: Math.min(currentPage * pageSize, filteredEmployees.length),
                  total: filteredEmployees.length,
                }),
              }}
            />
          )}
        </section>
      )}

      <Dialog
        header={t('filters')}
        visible={filtersOpen}
        modal
        className="employees-filter-dialog"
        onHide={() => setFiltersOpen(false)}
      >
        <div className="employees-filter-fields">
          <label>
            <span>{t('search')}</span>
            <InputText
              className="auran-prime-field"
              value={draftSearch}
              placeholder={t('searchPlaceholder')}
              onChange={(event) => setDraftSearch(event.target.value)}
            />
          </label>
          <label>
            <span>{t('status')}</span>
            <Dropdown
              className="auran-prime-field"
              value={draftStatus}
              options={[
                { label: t('allStatuses'), value: 'all' },
                { label: t('active'), value: 'active' },
                { label: t('inactive'), value: 'inactive' },
              ]}
              optionLabel="label"
              optionValue="value"
              filter
              panelClassName="auran-prime-panel"
              onChange={(event) => setDraftStatus(event.value)}
            />
          </label>
          <div className="employees-filter-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setSearch('')
                setStatus('all')
                setPage(1)
                setFiltersOpen(false)
              }}
            >
              {t('clearFilters')}
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => {
                setSearch(draftSearch)
                setStatus(draftStatus)
                setPage(1)
                setFiltersOpen(false)
              }}
            >
              {t('applyFilters')}
            </button>
          </div>
        </div>
      </Dialog>

      {selectedEmployee && (
        <Dialog
          header={t('manageTitle', { name: selectedEmployee.fullName })}
          visible
          modal
          className="employees-dialog"
          onHide={() => setSelectedId(null)}
        >
          <section className="panel employee-manager">
            <div className="panel-heading">
              <div>
                <h2>{t('manageTitle', { name: selectedEmployee.fullName })}</h2>
                <p className="muted">
                  {selectedEmployee.isSuperUser
                    ? t('protectedSuperUser')
                    : t('clinicEmployee')}
                </p>
              </div>
            </div>

            {canManageUsers && (
              <div className="employee-form">
                <label>
                  <span>{t('fullName')}</span>
                  <InputText
                    className="auran-prime-field"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('email')}</span>
                  <InputText
                    className="auran-prime-field"
                    type="email"
                    value={editEmail}
                    onChange={(event) => setEditEmail(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('phone')}</span>
                  <InputText
                    className="auran-prime-field"
                    value={editPhone}
                    onChange={(event) => setEditPhone(event.target.value)}
                  />
                </label>
                <div className="actions">
                  <button
                    className="button secondary"
                    disabled={
                      updateMutation.isPending || !editName.trim() || !editEmail.trim()
                    }
                    onClick={() =>
                      updateMutation.mutate({
                        userId: selectedEmployee.id,
                        fullName: editName.trim(),
                        email: editEmail.trim(),
                        phone: editPhone.trim() || undefined,
                      })
                    }
                  >
                    {updateMutation.isPending ? t('saving') : t('saveProfile')}
                  </button>
                </div>
              </div>
            )}

            {canManageRbac && !selectedEmployee.isSuperUser && (
              <div className="employee-section">
                <span className="form-section-label">{t('assignedRoles')}</span>
                <div className="role-choice-grid">
                  {(rolesQuery.data ?? []).map((role) => (
                    <label className="role-choice" key={role.code}>
                      <Checkbox
                        inputId={`employee-edit-role-${role.code}`}
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
                    {rolesMutation.isPending ? t('savingRoles') : t('saveRoles')}
                  </button>
                </div>
              </div>
            )}

            {canManageStatus && (
              <div className="employee-section">
                <span className="form-section-label">{t('accountStatus')}</span>
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
                      ? t('updating')
                      : selectedEmployee.isActive
                        ? t('deactivate')
                        : t('activate')}
                  </button>
                </div>
              </div>
            )}

            {(updateMutation.isError ||
              rolesMutation.isError ||
              statusMutation.isError) && (
              <p className="field-error">{t('changeError')}</p>
            )}
          </section>
        </Dialog>
      )}

      {canViewRbac && rolesOpen && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('matrixTitle')}</h2>
              <p className="muted">{t('matrixSubtitle')}</p>
            </div>
          </div>

          {rolesQuery.isLoading && <p className="state">{t('loadingRoles')}</p>}
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
