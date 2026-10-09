import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  createClinicalOrderSection,
  getClinicalOrderSectionAdminConfiguration,
  updateClinicalOrderSection,
} from './api'
import type {
  ClinicalOrderSectionAdmin,
  ClinicalOrderSectionAdminConfiguration,
} from './types'

const sectionTypes = ['Structured', 'Text', 'Image', 'File']

export function ClinicalOrderSectionConfigurationPanel() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')

  const [name, setName] = useState('')
  const [sectionType, setSectionType] = useState('Text')
  const [sortOrder, setSortOrder] = useState(0)

  const query = useQuery({
    queryKey: ['clinical-order-section-admin-configuration'],
    queryFn: getClinicalOrderSectionAdminConfiguration,
    enabled: canView,
  })

  const applyConfiguration = (
    configuration: ClinicalOrderSectionAdminConfiguration,
  ) => {
    queryClient.setQueryData(
      ['clinical-order-section-admin-configuration'],
      configuration,
    )
    void queryClient.invalidateQueries({ queryKey: ['clinical-order'] })
    void queryClient.invalidateQueries({ queryKey: ['clinical-order-attachments'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createClinicalOrderSection({
        name: name.trim(),
        sectionType,
        sortOrder,
      }),
    onSuccess: (configuration) => {
      applyConfiguration(configuration)
      setName('')
      setSectionType('Text')
      setSortOrder(0)
    },
  })

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Clinical order sections</h2>
          <p className="muted">
            Configure structured, text, image, and file sections used by the clinical order workspace.
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">Loading clinical order configuration…</p>}
      {query.isError && <p className="state error">Unable to load clinical order configuration.</p>}

      {canManage && (
        <div className="profile-config-create-row">
          <label>
            <span>New section name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>Type</span>
            <select
              value={sectionType}
              onChange={(event) => setSectionType(event.target.value)}
            >
              {sectionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort order</span>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </label>
          <div className="actions">
            <button
              className="button primary"
              disabled={!name.trim() || sortOrder < 0 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Adding…' : 'Add order section'}
            </button>
          </div>
        </div>
      )}

      {createMutation.isError && (
        <p className="field-error">Unable to create clinical order section.</p>
      )}

      <div className="profile-config-fields">
        {(query.data?.sections ?? []).map((section) => (
          <ClinicalOrderSectionEditor
            key={section.id}
            section={section}
            canManage={canManage}
            onConfiguration={applyConfiguration}
          />
        ))}
      </div>

      {query.data?.sections.length === 0 && (
        <p className="state">No clinical order sections are configured.</p>
      )}
    </section>
  )
}

function ClinicalOrderSectionEditor({
  section,
  canManage,
  onConfiguration,
}: {
  section: ClinicalOrderSectionAdmin
  canManage: boolean
  onConfiguration: (configuration: ClinicalOrderSectionAdminConfiguration) => void
}) {
  const [name, setName] = useState(section.name)
  const [sectionType, setSectionType] = useState(section.sectionType)
  const [sortOrder, setSortOrder] = useState(section.sortOrder)
  const [isEnabled, setIsEnabled] = useState(section.isEnabled)

  useEffect(() => {
    setName(section.name)
    setSectionType(section.sectionType)
    setSortOrder(section.sortOrder)
    setIsEnabled(section.isEnabled)
  }, [section])

  const mutation = useMutation({
    mutationFn: () =>
      updateClinicalOrderSection(section.id, {
        name: name.trim(),
        sectionType,
        sortOrder,
        isEnabled,
      }),
    onSuccess: onConfiguration,
  })

  return (
    <article className="profile-config-field-card">
      <div className="profile-config-field-heading">
        <div>
          <strong>{section.name}</strong>
          <div className="role-badges">
            <span className="role-badge">{section.sectionType}</span>
            {!section.isEnabled && <span className="role-badge">Disabled</span>}
            {section.hasData && <span className="role-badge">Has data</span>}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="profile-config-field-form">
          <label>
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>Type</span>
            <select
              value={sectionType}
              disabled={section.hasData}
              onChange={(event) => setSectionType(event.target.value)}
            >
              {sectionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort order</span>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </label>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => setIsEnabled(event.target.checked)}
            />
            <span>Enabled</span>
          </label>
          <div className="actions">
            <button
              className="button secondary"
              disabled={!name.trim() || sortOrder < 0 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Saving…' : 'Save section'}
            </button>
          </div>
        </div>
      )}

      {section.hasData && canManage && (
        <p className="muted">
          Section type is locked because clinical order data already exists. Name, order, and enabled state remain editable.
        </p>
      )}

      {mutation.isError && (
        <p className="field-error">Unable to update this clinical order section.</p>
      )}
    </article>
  )
}
