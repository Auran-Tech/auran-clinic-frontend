export function authenticatedHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function matchesApiResponse(response, path, method) {
  return (
    new URL(response.url()).pathname === '/api' + path &&
    response.request().method() === method
  )
}

export async function configureQueue(request, apiBase, token) {
  const headers = authenticatedHeaders(token)
  const start = await request.post(apiBase + '/workflow-config/statuses', {
    headers,
    data: { code: 'WAITING', name: 'Waiting', color: '#64748b', sortOrder: 0 },
  })
  if (start.status() !== 201)
    throw new Error('Waiting status setup failed: ' + start.status())
  const waiting = (await start.json()).data.statuses.find(
    (item) => item.code === 'WAITING',
  )
  const end = await request.post(apiBase + '/workflow-config/statuses', {
    headers,
    data: {
      code: 'EXIT',
      name: 'Exited',
      color: '#64748b',
      sortOrder: 1,
      isSystemFinal: true,
    },
  })
  if (end.status() !== 201) throw new Error('Exit status setup failed: ' + end.status())
  const exited = (await end.json()).data.statuses.find((item) => item.code === 'EXIT')
  const edges = await request.put(apiBase + '/workflow-config/transitions', {
    headers,
    data: { transitions: [{ fromStatusId: waiting.id, toStatusId: exited.id }] },
  })
  if (edges.status() !== 200)
    throw new Error('Transition setup failed: ' + edges.status())
  return { waiting, exited }
}

export async function createDoctor(
  request,
  apiBase,
  token,
  email,
  password,
  fullName = 'Integration Doctor',
) {
  const response = await request.post(apiBase + '/users', {
    headers: authenticatedHeaders(token),
    data: { fullName, email, password, roles: ['DOCTOR'], isSuperUser: false },
  })
  if (response.status() !== 201)
    throw new Error('Doctor setup failed: ' + response.status())
  return (await response.json()).data.id
}
