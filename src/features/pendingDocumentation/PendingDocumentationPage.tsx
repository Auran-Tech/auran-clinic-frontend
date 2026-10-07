import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  completePendingDocumentation,
  getPendingDocumentation,
} from './api'
import type { PendingDocumentation } from './types'

function PendingDocumentationEditor({
  item,
  onClose,
}: {
  item: PendingDocumentation
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [chiefComplaint, setChiefComplaint] = useState(item.chiefComplaint ?? '')
  const [examination, setExamination] = useState(item.examination ?? '')
  const [diagnosis, setDiagnosis] = useState(item.diagnosis ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [treatmentPlan, setTreatmentPlan] = useState(item.treatmentPlan ?? '')

  useEffect(() => {
    setChiefComplaint(item.chiefComplaint ?? '')
    setExamination(item.examination ?? '')
    setDiagnosis(item.diagnosis ?? '')
    setNotes(item.notes ?? '')
    setTreatmentPlan(item.treatmentPlan ?? '')
  }, [item])

  const mutation = useMutation({
    mutationFn: completePendingDocumentation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-documentation'] })
      onClose()
    },
  })

  const hasContent = Boolean(
    chiefComplaint.trim() ||
      examination.trim() ||
      diagnosis.trim() ||
      notes.trim() ||
      treatmentPlan.trim(),
  )

  return (
    <section className="pending-editor">
      <div className="panel-heading">
        <div>
          <h2>{item.patientName}</h2>
          <p className="muted mono">{item.patientNumber}</p>
        </div>
        <button className="button secondary" onClick={onClose}>Close</button>
      </div>

      <div className="clinical-form">
        <label>
          <span>Chief complaint</span>
          <textarea rows={3} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
        </label>
        <label>
          <span>Examination</span>
          <textarea rows={4} value={examination} onChange={(e) => setExamination(e.target.value)} />
        </label>
        <label>
          <span>Diagnosis</span>
          <textarea rows={4} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </label>
        <label>
          <span>Treatment plan</span>
          <textarea rows={4} value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} />
        </label>
        <label className="full-width">
          <span>Clinical notes</span>
          <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="actions clinical-actions">
        <button
          className="button primary"
          disabled={!hasContent || mutation.isPending}
          onClick={() => mutation.mutate({
            visitId: item.visitId,
            chiefComplaint: chiefComplaint || undefined,
            examination: examination || undefined,
            diagnosis: diagnosis || undefined,
            notes: notes || undefined,
            treatmentPlan: treatmentPlan || undefined,
          })}
        >
          {mutation.isPending ? 'Completing…' : 'Complete documentation'}
        </button>
      </div>

      {mutation.isError && (
        <p className="field-error">Unable to complete this documentation.</p>
      )}
    </section>
  )
}

export function PendingDocumentationPage() {
  const auth = useAuth()
  const [selected, setSelected] = useState<PendingDocumentation | null>(null)
  const [mineOnly, setMineOnly] = useState(true)

  const query = useQuery({
    queryKey: ['pending-documentation', mineOnly],
    queryFn: () => getPendingDocumentation(mineOnly),
    enabled: auth.hasPermission('Visit_View'),
  })

  if (!auth.hasPermission('Visit_View')) {
    return (
      <main className="page-shell">
        <p className="state error">You do not have permission to view pending documentation.</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Clinical operations</p>
          <h1>Pending documentation</h1>
          <p className="muted">Finish Draft or Pending visit notes after the operational visit ends.</p>
        </div>
        <div className="actions">
          {auth.session?.user.isSuperUser && (
            <label className="inline-toggle">
              <input
                type="checkbox"
                checked={!mineOnly}
                onChange={(event) => setMineOnly(!event.target.checked)}
              />
              <span>All doctors</span>
            </label>
          )}
          {auth.hasPermission('FollowUp_View') && (
            <Link className="button secondary nav-button" to="/follow-ups">Follow-ups</Link>
          )}
          <Link className="button secondary nav-button" to="/queue">Live queue</Link>
          <Link className="button secondary nav-button" to="/patients">Patients</Link>
        </div>
      </section>

      <section className="panel">
        {query.isLoading && <p className="state">Loading pending documentation…</p>}
        {query.isError && <p className="state error">Unable to load pending documentation.</p>}
        {query.data?.length === 0 && <p className="state">No pending documentation.</p>}

        {query.data && query.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Visit</th>
                  <th>Documentation</th>
                  <th>Started</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr key={item.visitId}>
                    <td>
                      <Link className="patient-link" to={`/patients/${item.patientId}`}>
                        <strong>{item.patientName}</strong>
                      </Link>
                      <div className="muted mono">{item.patientNumber}</div>
                    </td>
                    <td>{item.doctorName}</td>
                    <td>{item.visitStatus}</td>
                    <td>{item.documentationStatus}</td>
                    <td>{new Date(item.entryAtUtc).toLocaleString()}</td>
                    <td>
                      {auth.hasPermission('Visit_Edit') && (
                        <button className="button secondary" onClick={() => setSelected(item)}>
                          Finish note
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section className="panel">
          <PendingDocumentationEditor item={selected} onClose={() => setSelected(null)} />
        </section>
      )}
    </main>
  )
}
