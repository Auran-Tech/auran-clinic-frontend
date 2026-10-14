export function authenticatedHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}
