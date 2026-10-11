import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  deletePatientAttachment,
  downloadPatientAttachment,
  getPatientAttachments,
  uploadPatientAttachment,
} from './api'

export function PatientAttachmentsPanel({ patientId }: { patientId: string }) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canView = auth.hasPermission('Files_View')
  const canUpload = auth.hasPermission('Files_Upload')
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')

  const attachmentsQuery = useQuery({
    queryKey: ['patient-attachments', patientId],
    queryFn: () => getPatientAttachments(patientId),
    enabled: canView,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadPatientAttachment,
    onSuccess: async () => {
      setFile(null)
      setCategory('')
      setNotes('')
      await queryClient.invalidateQueries({ queryKey: ['patient-attachments', patientId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePatientAttachment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['patient-attachments', patientId] })
    },
  })

  if (!canView) return null

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Attachments</h2>
          <p className="muted">Images and PDFs linked to this patient.</p>
        </div>
      </div>

      {canUpload && (
        <div className="attachment-upload">
          <label>
            <span>File</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <label>
            <span>Category</span>
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Lab, Scan, Prescription" />
          </label>

          <label className="full-width">
            <span>Notes</span>
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          <div className="actions full-width">
            <button
              className="button primary"
              disabled={!file || uploadMutation.isPending}
              onClick={() => file && uploadMutation.mutate({
                patientId,
                file,
                category: category || undefined,
                notes: notes || undefined,
              })}
            >
              {uploadMutation.isPending ? 'Uploading…' : 'Upload attachment'}
            </button>
          </div>

          {uploadMutation.isError && (
            <p className="field-error full-width">
              Upload failed. Use JPEG, PNG, WebP, or PDF up to 10 MB.
            </p>
          )}
        </div>
      )}

      {attachmentsQuery.isLoading && <p className="state">Loading attachments…</p>}
      {attachmentsQuery.isError && <p className="state error">Unable to load attachments.</p>}

      {attachmentsQuery.data && attachmentsQuery.data.length === 0 && (
        <p className="state">No attachments uploaded.</p>
      )}

      {attachmentsQuery.data && attachmentsQuery.data.length > 0 && (
        <div className="attachment-list">
          {attachmentsQuery.data.map((attachment) => (
            <article className="attachment-card" key={attachment.attachmentId}>
              <div>
                <strong>{attachment.originalName}</strong>
                <p className="muted">
                  {attachment.category || 'Uncategorized'} · {(attachment.size / 1024).toFixed(1)} KB
                </p>
                {attachment.notes && <p>{attachment.notes}</p>}
              </div>

              <div className="actions">
                <button
                  className="button secondary"
                  onClick={() => void downloadPatientAttachment(attachment.fileId, attachment.originalName)}
                >
                  Download
                </button>
                {canUpload && (
                  <button
                    className="button danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(attachment.attachmentId)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
