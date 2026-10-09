import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  getClinicalOrderAttachmentWorkspace,
  linkClinicalOrderAttachment,
  unlinkClinicalOrderAttachment,
} from './api'
import type {
  ClinicalOrderAttachmentFile,
  ClinicalOrderAttachmentSection,
} from './types'

export function ClinicalOrderAttachmentsPanel({ visitId }: { visitId: string }) {
  const auth = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Visit_View')
  const canEdit = auth.hasPermission('Visit_Edit')
  const [sectionId, setSectionId] = useState('')
  const [fileId, setFileId] = useState('')

  const query = useQuery({
    queryKey: ['clinical-order-attachments', visitId],
    queryFn: () => getClinicalOrderAttachmentWorkspace(visitId),
    enabled: canView,
  })

  const selectedSection = query.data?.sections.find(
    (section) => section.sectionDefinitionId === sectionId,
  )

  const eligibleFiles = useMemo(() => {
    if (!query.data || !selectedSection) return []

    const alreadyLinked = new Set(
      query.data.links
        .filter((link) => link.sectionDefinitionId === selectedSection.sectionDefinitionId)
        .map((link) => link.fileId),
    )

    return query.data.files.filter((file) => {
      if (alreadyLinked.has(file.fileId)) return false
      return isEligibleForSection(file, selectedSection)
    })
  }, [query.data, selectedSection])

  const linkMutation = useMutation({
    mutationFn: () =>
      linkClinicalOrderAttachment({
        visitId,
        fileId,
        sectionDefinitionId: sectionId,
      }),
    onSuccess: (workspace) => {
      queryClient.setQueryData(['clinical-order-attachments', visitId], workspace)
      setFileId('')
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: unlinkClinicalOrderAttachment,
    onSuccess: (workspace) => {
      queryClient.setQueryData(['clinical-order-attachments', visitId], workspace)
    },
  })

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('orderAttachments.title')}</h2>
          <p className="muted">
            {t('orderAttachments.intro')}
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">{t('orderAttachments.loading')}</p>}
      {query.isError && <p className="state error">{t('orderAttachments.loadError')}</p>}

      {query.data && query.data.sections.length === 0 && (
        <p className="state">{t('orderAttachments.noSections')}</p>
      )}

      {query.data && query.data.sections.length > 0 && canEdit && (
        <div className="order-attachment-link-form">
          <label>
            <span>{t('orderAttachments.orderSection')}</span>
            <select
              value={sectionId}
              onChange={(event) => {
                setSectionId(event.target.value)
                setFileId('')
              }}
            >
              <option value="">{t('orderAttachments.selectSection')}</option>
              {query.data.sections.map((section) => (
                <option
                  key={section.sectionDefinitionId}
                  value={section.sectionDefinitionId}
                >
                  {section.name} ({section.sectionType})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{t('orderAttachments.patientAttachment')}</span>
            <select
              value={fileId}
              disabled={!selectedSection}
              onChange={(event) => setFileId(event.target.value)}
            >
              <option value="">
                {selectedSection ? t('orderAttachments.selectFile') : t('orderAttachments.selectSectionFirst')}
              </option>
              {eligibleFiles.map((file) => (
                <option key={file.fileId} value={file.fileId}>
                  {file.originalName}
                </option>
              ))}
            </select>
          </label>

          <div className="actions">
            <button
              className="button primary"
              disabled={!sectionId || !fileId || linkMutation.isPending}
              onClick={() => linkMutation.mutate()}
            >
              {linkMutation.isPending ? t('orderAttachments.linking') : t('orderAttachments.link')}
            </button>
          </div>
        </div>
      )}

      {selectedSection && canEdit && eligibleFiles.length === 0 && (
        <p className="muted">
          {t('orderAttachments.noEligible')}
        </p>
      )}

      {linkMutation.isError && (
        <p className="field-error">
          {t('orderAttachments.linkError')}
        </p>
      )}

      {query.data && (
        <div className="order-attachment-sections">
          {query.data.sections.map((section) => {
            const links = query.data.links.filter(
              (link) => link.sectionDefinitionId === section.sectionDefinitionId,
            )

            return (
              <div className="order-attachment-section" key={section.sectionDefinitionId}>
                <div className="order-attachment-section-heading">
                  <div>
                    <span className="profile-label">{section.sectionType}</span>
                    <h3>{section.name}</h3>
                  </div>
                  <span className="role-badge">{t('orderAttachments.linkedCount', { count: links.length })}</span>
                </div>

                {links.length === 0 ? (
                  <p className="muted">{t('orderAttachments.noLinked')}</p>
                ) : (
                  <div className="order-attachment-list">
                    {links.map((link) => (
                      <article className="order-attachment-card" key={link.linkId}>
                        <div>
                          <strong>{link.originalName}</strong>
                          <p className="muted">
                            {link.contentType} · {(link.size / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        {canEdit && (
                          <button
                            className="button danger"
                            disabled={unlinkMutation.isPending}
                            onClick={() => unlinkMutation.mutate(link.linkId)}
                          >
                            {t('orderAttachments.unlink')}
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {query.data && query.data.files.length === 0 && (
        <p className="muted">
          {t('orderAttachments.uploadFirst')}
        </p>
      )}

      {unlinkMutation.isError && (
        <p className="field-error">
          {t('orderAttachments.unlinkError')}
        </p>
      )}
    </section>
  )
}

function isEligibleForSection(
  file: ClinicalOrderAttachmentFile,
  section: ClinicalOrderAttachmentSection,
) {
  if (section.sectionType === 'Image') {
    return file.contentType.toLowerCase().startsWith('image/')
  }

  return section.sectionType === 'File'
}
