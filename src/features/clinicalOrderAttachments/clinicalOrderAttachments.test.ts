import { describe, expect, it } from 'vitest'

function isEligible(contentType: string, sectionType: string) {
  if (sectionType === 'Image') return contentType.toLowerCase().startsWith('image/')
  return sectionType === 'File'
}

describe('clinical order attachment eligibility', () => {
  it('allows images in image sections', () => {
    expect(isEligible('image/png', 'Image')).toBe(true)
  })

  it('rejects PDFs from image sections', () => {
    expect(isEligible('application/pdf', 'Image')).toBe(false)
  })

  it('allows patient uploads in file sections', () => {
    expect(isEligible('application/pdf', 'File')).toBe(true)
  })
})
