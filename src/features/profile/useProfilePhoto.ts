import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProfilePhoto } from './api'

export function useProfilePhoto(userId: string) {
  const photo = useQuery({
    queryKey: ['profile-photo', userId],
    queryFn: getProfilePhoto,
  })
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photo.data) {
      setUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(photo.data)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photo.data])

  return { url, photo }
}
