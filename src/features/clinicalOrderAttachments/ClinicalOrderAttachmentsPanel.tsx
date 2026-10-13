import { useMemo, useState } from 'react'
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
          <h2>Clinical order files & images</h2>
          <p className="muted">
            Link existing patient uploads into configured Image/File order sections.
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">Loading order attachments…</p>}
      {query.isError && <p className="state error">Unable to load order attachments.</p>}

      {query.data && query.data.sections.length === 0 && (
        <p className="state">No Image/File clinical-order sections are configured.</p>
      )}

      {query.data && query.data.sections.length > 0 && canEdit && (
        <div className="order-attachment-link-form">
          <label>
            <span>Order section</span>
            <select
              value={sectionId}
              onChange={(event) => {
                setSectionId(event.target.value)
                setFileId('')
              }}
            >
              <option value="">Select section</option>
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
            <span>Patient attachment</span>
            <select
              value={fileId}
              disabled={!selectedSection}
              onChange={(event) => setFileId(event.target.value)}
            >
              <option value="">
                {selectedSection ? 'Select file' : 'Select a section first'}
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
              {linkMutation.isPending ? 'Linking…' : 'Link attachment'}
            </button>
          </div>
        </div>
      )}

      {selectedSection && canEdit && eligibleFiles.length === 0 && (
        <p className="muted">
          No additional eligible patient uploads are available for this section.
        </p>
      )}

      {linkMutation.isError && (
        <p className="field-error">
          Unable to link this file. Image sections only accept images, and duplicate links are not allowed.
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
                  <span className="role-badge">{links.length} linked</span>
                </div>

                {links.length === 0 ? (
                  <p className="muted">No files linked to this section.</p>
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
                            Unlink
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
          Upload patient attachments first, then link them into the clinical order.
        </p>
      )}

      {unlinkMutation.isError && (
        <p className="field-error">
          Unable to unlink this file. The clinical visit may already be closed.
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
