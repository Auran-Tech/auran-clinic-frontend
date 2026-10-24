import './profile.css'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { useTheme, type Theme } from '../../app/themeState'
import { getProfile, updateProfile, uploadProfilePhoto } from './api'
import { ProfileSecurity } from './ProfileSecurity'
import { useProfilePhoto } from './useProfilePhoto'
import type { AppLanguage } from '../../lib/preferences'

export function ProfilePage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation('profile')
  const user = auth.session!.user
  const fileInput = useRef<HTMLInputElement>(null)
  const { url: savedPhotoUrl } = useProfilePhoto(user.userId)
  const profileQuery = useQuery({
    queryKey: ['profile', user.userId],
    queryFn: getProfile,
  })
  const [name, setName] = useState(user.fullName)
  const [email, setEmail] = useState(user.email ?? '')
  const [language, setLanguage] = useState<AppLanguage>(
    i18n.resolvedLanguage === 'ar' ? 'ar' : 'en',
  )
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme)
  const [saved, setSaved] = useState(false)
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => {
    if (!pendingPhoto) {
      setPendingPhotoUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(pendingPhoto)
    setPendingPhotoUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingPhoto])

  useEffect(() => {
    if (!profileQuery.data) return
    setName(profileQuery.data.fullName)
    setEmail(profileQuery.data.email ?? '')
  }, [profileQuery.data])

  useEffect(() => {
    setLanguage(i18n.resolvedLanguage === 'ar' ? 'ar' : 'en')
  }, [i18n.resolvedLanguage])

  useEffect(() => {
    setSelectedTheme(theme)
  }, [theme])

  const saveProfile = useMutation({
    mutationFn: async () => {
      const profile = await updateProfile({ fullName: name.trim(), email: email.trim() })
      let photoSaved = true
      if (pendingPhoto) {
        try {
          await uploadProfilePhoto(pendingPhoto)
        } catch {
          photoSaved = false
        }
      }
      return { profile, photoSaved }
    },
    onSuccess: async ({ profile, photoSaved }) => {
      if (pendingPhoto && photoSaved) {
        setPendingPhoto(null)
        await queryClient.invalidateQueries({ queryKey: ['profile-photo', user.userId] })
      }
      setPhotoError(!photoSaved)
      queryClient.setQueryData(['profile', user.userId], profile)
      const session = auth.session
      if (session) {
        auth.setSession({
          ...session,
          user: {
            ...session.user,
            fullName: profile.fullName,
            email: profile.email,
          },
        })
      }
      setTheme(selectedTheme)
      await i18n.changeLanguage(language)
      setSaved(true)
    },
  })

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  function cancelChanges() {
    setName(profileQuery.data?.fullName ?? user.fullName)
    setEmail(profileQuery.data?.email ?? user.email ?? '')
    setLanguage(i18n.resolvedLanguage === 'ar' ? 'ar' : 'en')
    setSelectedTheme(theme)
    saveProfile.reset()
    setSaved(false)
    setPendingPhoto(null)
    setPhotoError(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    saveProfile.mutate()
  }

  function selectPhoto(file: File | undefined) {
    if (!file) return
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setPhotoError(true)
      return
    }

    setPhotoError(false)
    setPendingPhoto(file)
  }

  return (
    <main className="page-shell profile-page">
      <header className="page-header">
        <div>
          <h1>{t('title')}</h1>
          <p className="muted">{t('subtitle')}</p>
        </div>
      </header>

      {profileQuery.isLoading && <p className="state">{t('loading')}</p>}
      {profileQuery.isError && <p className="state error">{t('loadError')}</p>}

      {profileQuery.data && (
        <div className="profile-layout">
          <aside className="panel profile-identity">
            <span className="profile-avatar" aria-hidden="true">
              {pendingPhotoUrl || savedPhotoUrl ? (
                <img src={pendingPhotoUrl || savedPhotoUrl || ''} alt="" />
              ) : (
                initials
              )}
            </span>
            <h2>{name || profileQuery.data.fullName}</h2>
            <span className="profile-role">
              {profileQuery.data.isSuperUser
                ? t('superUser')
                : profileQuery.data.roles.join(', ') || t('staff')}
            </span>
            <p className="muted">{email || profileQuery.data.email}</p>
            <input
              ref={fileInput}
              accept="image/jpeg,image/png,image/webp"
              className="profile-photo-input"
              type="file"
              onChange={(event) => selectPhoto(event.target.files?.[0])}
            />
            <button
              className="button secondary profile-photo-button"
              type="button"
              onClick={() => fileInput.current?.click()}
            >
              {t('changePhoto')}
            </button>
            {photoError && <p className="profile-error">{t('photoError')}</p>}
          </aside>

          <div className="profile-main">
            <form className="panel profile-form" onSubmit={submit}>
              <h2>{t('personalInformation')}</h2>
              <div className="profile-fields">
                <label>
                  <span>{t('name')}</span>
                  <input
                    autoComplete="name"
                    maxLength={200}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('email')}</span>
                  <input
                    autoComplete="email"
                    maxLength={256}
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('language')}</span>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                  >
                    <option value="ar">{t('arabic')}</option>
                    <option value="en">{t('english')}</option>
                  </select>
                </label>
                <label>
                  <span>{t('theme')}</span>
                  <select
                    value={selectedTheme}
                    onChange={(event) => setSelectedTheme(event.target.value as Theme)}
                  >
                    <option value="dark">{t('dark')}</option>
                    <option value="light">{t('light')}</option>
                  </select>
                </label>
              </div>

              {saveProfile.isError && (
                <p className="state error" role="alert">
                  {t('saveError')}
                </p>
              )}
              {saved && (
                <p className="profile-success" role="status">
                  {t('saved')}
                </p>
              )}

              <div className="actions profile-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={cancelChanges}
                  disabled={saveProfile.isPending}
                >
                  {t('cancel')}
                </button>
                <button
                  className="button primary"
                  type="submit"
                  disabled={saveProfile.isPending}
                >
                  {t('save')}
                </button>
              </div>
            </form>
            <ProfileSecurity />
          </div>
        </div>
      )}
    </main>
  )
}
