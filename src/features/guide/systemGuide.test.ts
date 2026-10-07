import { describe, expect, it } from 'vitest'

interface GuideCard {
  to: string
  permission?: string
}

function isVisible(
  card: GuideCard,
  hasPermission: (permission: string) => boolean,
) {
  if (card.to === '/employees') {
    return hasPermission('Users_View') || hasPermission('RBAC_View')
  }

  return !card.permission || hasPermission(card.permission)
}

describe('system guide visibility', () => {
  it('shows a permission-free card', () => {
    expect(isVisible({ to: '/patients' }, () => false)).toBe(true)
  })

  it('hides a protected card without its permission', () => {
    expect(
      isVisible({ to: '/reports', permission: 'Reports_View' }, () => false),
    ).toBe(false)
  })
})
