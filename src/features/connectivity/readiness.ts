import { readyUrl } from '../../lib/apiConfig'

export async function probeReadiness(): Promise<boolean> {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<false>((resolve) => {
    timeout = setTimeout(() => {
      controller.abort()
      resolve(false)
    }, 5_000)
  })

  try {
    const request = fetch(readyUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => response.ok)
      .catch(() => false)

    return await Promise.race([request, timedOut])
  } catch {
    return false
  } finally {
    if (timeout !== undefined) clearTimeout(timeout)
  }
}
