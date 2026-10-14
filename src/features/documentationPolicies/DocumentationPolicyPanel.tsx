import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { getDoctors } from '../users/api'
import {
  DOCUMENTATION_FIELDS,
  assignDoctorDocumentationSpecialty,
  getSpecialtyDocumentationPolicy,
  saveSpecialtyDocumentationPolicy,
} from './api'

const VALID_CODE = /^[A-Z0-9_-]{1,64}$/

export function DocumentationPolicyPanel() {
  const auth = useAuth()
  const canView = auth.hasPermission('Settings_View')
  const canManage = auth.hasPermission('Settings_Manage')
  const queryClient = useQueryClient()
  const [specialtyCode, setSpecialtyCode] = useState('GENERAL')
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [doctorId, setDoctorId] = useState('')

  const validCode = VALID_CODE.test(specialtyCode)
  const policyQuery = useQuery({
    queryKey: ['specialty-documentation-policy', specialtyCode],
    queryFn: () => getSpecialtyDocumentationPolicy(specialtyCode),
    enabled: canView && validCode,
  })
  const doctorsQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: canManage && auth.hasPermission('Users_View'),
  })

  useEffect(() => {
    if (policyQuery.isSuccess) {
      setRequiredFields(policyQuery.data?.requiredFields ?? [])
    }
  }, [policyQuery.data, policyQuery.isSuccess])

  const savePolicy = useMutation({
    mutationFn: saveSpecialtyDocumentationPolicy,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['specialty-documentation-policy', specialtyCode],
      })
    },
  })
  const assignDoctor = useMutation({
    mutationFn: assignDoctorDocumentationSpecialty,
  })

  if (!canView) return null

  return (
    <section className="panel" aria-label="Specialty documentation policies">
      <div className="panel-heading">
        <div>
          <h2>Specialty documentation requirements</h2>
          <p className="muted">
            Configure which fields must be filled before a doctor's documentation can be
            finalized. The clinical owner must approve every specialty rule.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <label>
          <span>Specialty code</span>
          <input
            value={specialtyCode}
            maxLength={64}
            onChange={(event) => {
              setSpecialtyCode(event.target.value.toUpperCase().replace(/\s/g, '_'))
              setRequiredFields([])
            }}
            placeholder="GENERAL"
          />
        </label>
      </div>
      {!validCode && (
        <p className="field-error">Use uppercase letters, digits, underscores or hyphens.</p>
      )}
      {policyQuery.isLoading && validCode && <p className="state">Loading specialty policy…</p>}
      {policyQuery.isError && <p className="state error">Unable to read specialty rules.</p>}
      {policyQuery.isSuccess && (
        <p className="muted">
          {policyQuery.data
            ? `Policy version ${policyQuery.data.version}`
            : 'No specialty policy configured. The existing basic documentation validation applies.'}
        </p>
      )}

      <div className="settings-grid">
        {DOCUMENTATION_FIELDS.map((field) => (
          <label key={field.key} className="inline-toggle">
            <input
              type="checkbox"
              checked={requiredFields.includes(field.key)}
              disabled={!canManage || !validCode || policyQuery.isFetching}
              onChange={(event) => setRequiredFields((current) =>
                event.target.checked
                  ? [...current, field.key]
                  : current.filter((name) => name !== field.key)
              )}
            />
            <span>{field.label} required</span>
          </label>
        ))}
      </div>

      {canManage && (
        <>
          <div className="actions">
            <button
              className="button secondary"
              disabled={!validCode || requiredFields.length === 0 ||
                policyQuery.isFetching || savePolicy.isPending}
              onClick={() => savePolicy.mutate({ specialtyCode, requiredFields })}
            >
              {savePolicy.isPending ? 'Saving…' : 'Save specialty requirements'}
            </button>
          </div>
          {savePolicy.isSuccess && <p className="state" role="status">Specialty rules saved and audited.</p>}
          {savePolicy.isError && <p className="state error">Unable to save specialty requirements.</p>}

          {auth.hasPermission('Users_View') && (
            <div className="settings-grid">
              <label>
                <span>Assign specialty to doctor</span>
                <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
                  <option value="">Select doctor</option>
                  {(doctorsQuery.data ?? []).map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                  ))}
                </select>
              </label>
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={!doctorId || !validCode || assignDoctor.isPending}
                  onClick={() => assignDoctor.mutate({ doctorId, specialtyCode })}
                >
                  {assignDoctor.isPending ? 'Assigning…' : 'Assign to doctor'}
                </button>
              </div>
            </div>
          )}
          {assignDoctor.isSuccess && <p className="state" role="status">Doctor specialty saved.</p>}
          {assignDoctor.isError && <p className="state error">Unable to assign doctor specialty.</p>}
        </>
      )}
    </section>
  )
}
