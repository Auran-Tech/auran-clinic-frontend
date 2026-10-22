import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  connectionFailureEvent,
  connectionRestoredEvent,
} from '../../lib/connectionSignals'
import { ConnectionMonitor } from './ConnectionMonitor'
import { probeReadiness } from './readiness'
import './connectivity.css'

export function ConnectionGate({ children }: PropsWithChildren) {
  const [monitor] = useState(() => new ConnectionMonitor(probeReadiness))
  const snapshot = useSyncExternalStore(monitor.subscribe, monitor.getSnapshot)
  const [hasConnected, setHasConnected] = useState(false)
  const wasConnected = useRef(false)
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation(['connectivity', 'language'])

  useEffect(() => {
    monitor.start()
    const onOnline = () => {
      if (monitor.getSnapshot().phase === 'connected') monitor.checkAfterRequestFailure()
      else monitor.retryNow()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') onOnline()
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', monitor.checkAfterRequestFailure)
    window.addEventListener(connectionFailureEvent, monitor.checkAfterRequestFailure)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(connectionFailureEvent, monitor.checkAfterRequestFailure)
      window.removeEventListener('offline', monitor.checkAfterRequestFailure)
      window.removeEventListener('online', onOnline)
      monitor.stop()
    }
  }, [monitor])

  useEffect(() => {
    if (snapshot.phase !== 'connected') return
    setHasConnected(true)
    if (wasConnected.current) {
      void queryClient.invalidateQueries()
      window.dispatchEvent(new Event(connectionRestoredEvent))
    }
    wasConnected.current = true
  }, [snapshot.phase, queryClient])

  const blocked = snapshot.phase !== 'connected'
  const isArabic = i18n.resolvedLanguage === 'ar'

  return (
    <>
      {hasConnected && (
        <div className="connection-app" inert={blocked}>
          {children}
        </div>
      )}
      {!hasConnected && (
        <div className="auran-startup" role="status" aria-live="polite">
          <div className="auran-startup-mark" aria-hidden="true">
            A
          </div>
          <p className="auran-startup-brand">
            AURAN <span>CLINIC</span>
          </p>
          <h1>{t('connectivity:loadingTitle')}</h1>
          <p>{t('connectivity:loadingBody')}</p>
          <div className="auran-startup-progress" aria-hidden="true">
            <span />
          </div>
        </div>
      )}
      {blocked && (
        <button
          type="button"
          className="connection-language"
          onClick={() => void i18n.changeLanguage(isArabic ? 'en' : 'ar')}
        >
          {isArabic ? t('language:english') : t('language:arabic')}
        </button>
      )}
      {(snapshot.phase === 'retrying' ||
        (snapshot.phase === 'checking' && hasConnected)) && (
        <div className="connection-retry-layer" role="status" aria-live="polite">
          <div
            className={`connection-banner${snapshot.phase === 'checking' ? ' is-checking' : ''}`}
          >
            <svg
              className="is-spinning"
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 11a8 8 0 0 0-14-5L4 8m0-5v5h5M4 13a8 8 0 0 0 14 5l2-2m0 5v-5h-5" />
            </svg>
            <span>
              {snapshot.phase === 'retrying'
                ? t('connectivity:retryingBanner', { seconds: snapshot.seconds })
                : t('connectivity:checkingTitle')}
            </span>
          </div>
          <p className="connection-retry-description">
            {snapshot.phase === 'retrying'
              ? t('connectivity:retryingBody')
              : t('connectivity:checkingBody')}
          </p>
        </div>
      )}
      {snapshot.phase === 'disconnected' && (
        <div
          className="connection-cover"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="connection-title"
          aria-describedby="connection-body"
        >
          <section className="connection-card">
            <div className="connection-banner is-disconnected" role="status">
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 11a8 8 0 0 0-14-5L4 8m0-5v5h5M4 13a8 8 0 0 0 14 5l2-2m0 5v-5h-5" />
              </svg>
              <span>{t('connectivity:disconnectedBanner')}</span>
            </div>
            <div className="connection-mark" aria-hidden="true">
              A
            </div>
            <p className="connection-eyebrow">AURAN CLINIC</p>
            <h1 id="connection-title">{t('connectivity:disconnectedTitle')}</h1>
            <p id="connection-body">{t('connectivity:disconnectedBody')}</p>
            <button
              className="connection-retry-button"
              type="button"
              onClick={monitor.retryNow}
            >
              {t('connectivity:retryNow')}
            </button>
            <p className="connection-footnote">{t('connectivity:automaticCheck')}</p>
          </section>
        </div>
      )}
    </>
  )
}
