import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          <h2>{t('adminConfig.orderSections.title')}</h2>
          <p className="muted">
            {t('adminConfig.orderSections.intro')}
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">{t('adminConfig.orderSections.loading')}</p>}
      {query.isError && <p className="state error">{t('adminConfig.orderSections.loadError')}</p>}

      {canManage && (
        <div className="profile-config-create-row">
          <label>
            <span>{t('adminConfig.orderSections.newSection')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>{t('adminConfig.type')}</span>
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
            <span>{t('adminConfig.sortOrder')}</span>
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
              {createMutation.isPending ? t('adminConfig.adding') : t('adminConfig.orderSections.addSection')}
            </button>
          </div>
        </div>
      )}

      {createMutation.isError && (
        <p className="field-error">{t('adminConfig.orderSections.createError')}</p>
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
        <p className="state">{t('adminConfig.orderSections.empty')}</p>
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
  const { t } = useTranslation()
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
            {!section.isEnabled && <span className="role-badge">{t('adminConfig.disabled')}</span>}
            {section.hasData && <span className="role-badge">{t('adminConfig.hasData')}</span>}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="profile-config-field-form">
          <label>
            <span>{t('adminConfig.name')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>{t('adminConfig.type')}</span>
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
            <span>{t('adminConfig.sortOrder')}</span>
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
            <span>{t('adminConfig.enabled')}</span>
          </label>
          <div className="actions">
            <button
              className="button secondary"
              disabled={!name.trim() || sortOrder < 0 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? t('adminConfig.saving') : t('adminConfig.orderSections.saveSection')}
            </button>
          </div>
        </div>
      )}

      {section.hasData && canManage && (
        <p className="muted">
          {t('adminConfig.orderSections.typeLocked')}
        </p>
      )}

      {mutation.isError && (
        <p className="field-error">{t('adminConfig.orderSections.updateError')}</p>
      )}
    </article>
  )
}
