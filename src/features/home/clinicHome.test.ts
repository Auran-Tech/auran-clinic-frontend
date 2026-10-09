import { describe, expect, it } from 'vitest'

interface HomeCard {
  to: string
  permission?: string
}

function isVisible(
  card: HomeCard,
  hasPermission: (permission: string) => boolean,
) {
  if (card.to === '/employees') {
    return hasPermission('Users_View') || hasPermission('RBAC_View')
  }

  return !card.permission || hasPermission(card.permission)
}

describe('clinic home workflow visibility', () => {
  it('shows permission-free cards', () => {
    expect(isVisible({ to: '/guide' }, () => false)).toBe(true)
  })

  it('hides protected cards without permission', () => {
    expect(
      isVisible({ to: '/reports', permission: 'Reports_View' }, () => false),
    ).toBe(false)
  })

  it('shows employees for RBAC viewers', () => {
    expect(
      isVisible(
        { to: '/employees' },
        (permission) => permission === 'RBAC_View',
      ),
    ).toBe(true)
  })
})
