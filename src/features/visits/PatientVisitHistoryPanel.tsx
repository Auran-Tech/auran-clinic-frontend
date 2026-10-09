import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPatientVisitHistory } from './api'

export function PatientVisitHistoryPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const query = useQuery({
    queryKey: ['patient-visit-history', patientId, page],
    queryFn: () => getPatientVisitHistory(patientId, page, pageSize),
  })

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t('visitHistory.title')}</h2>
          <p className="muted">
            {t('visitHistory.intro')}
          </p>
        </div>
      </div>

      {query.isLoading && <p className="state">{t('visitHistory.loading')}</p>}
      {query.isError && <p className="state error">{t('visitHistory.loadError')}</p>}

      {query.data && query.data.visits.data.length === 0 && (
        <p className="state">{t('visitHistory.empty')}</p>
      )}

      {query.data && query.data.visits.data.length > 0 && (
        <>
          <div className="visit-history-list">
            {query.data.visits.data.map((visit) => (
              <article className="visit-history-card" key={visit.visitId}>
                <div className="visit-history-heading">
                  <div>
                    <strong>{new Date(visit.entryAtUtc).toLocaleString()}</strong>
                    <p className="muted">{t('visitHistory.doctorPrefix')} {visit.doctorName}</p>
                  </div>
                  <div className="role-badges">
                    <span className="role-badge">{visit.status}</span>
                    <span className="role-badge">{visit.documentationStatus}</span>
                  </div>
                </div>

                <div className="visit-history-meta">
                  <div>
                    <span className="profile-label">{t('visitHistory.sessions')}</span>
                    <strong>{visit.sessionCount}</strong>
                  </div>
                  <div>
                    <span className="profile-label">{t('visitHistory.completed')}</span>
                    <strong>
                      {visit.completedAtUtc
                        ? new Date(visit.completedAtUtc).toLocaleString()
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="profile-label">{t('visitHistory.exited')}</span>
                    <strong>
                      {visit.exitAtUtc
                        ? new Date(visit.exitAtUtc).toLocaleString()
                        : '—'}
                    </strong>
                  </div>
                </div>

                {(visit.chiefComplaint || visit.diagnosis) && (
                  <div className="visit-history-summary">
                    {visit.chiefComplaint && (
                      <div>
                        <span className="profile-label">{t('visitHistory.chiefComplaint')}</span>
                        <p>{visit.chiefComplaint}</p>
                      </div>
                    )}
                    {visit.diagnosis && (
                      <div>
                        <span className="profile-label">{t('visitHistory.diagnosis')}</span>
                        <p>{visit.diagnosis}</p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="visit-history-pagination">
            <span className="muted">
              {t('visitHistory.page', { current: query.data.visits.setting.currentPage, total: query.data.visits.setting.totalPage, count: query.data.visits.setting.totalCount })}
            </span>
            <div className="actions">
              <button
                className="button secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t('visitHistory.newer')}
              </button>
              <button
                className="button secondary"
                disabled={page >= query.data.visits.setting.totalPage}
                onClick={() => setPage((current) => current + 1)}
              >
                {t('visitHistory.older')}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
