import { isGitHubIssuesPage, isIssueDetailPage } from './url-utils'

describe('GitHub URL Validators', () => {
  let originalWindow: Window

  beforeEach(() => {
    originalWindow = window

    delete (window as any).location
    window.location = new URL('https://github.com/owner/repo/issues') as any
  })

  afterEach(() => {
    window = originalWindow as typeof window
  })

  describe('isGitHubIssuesPage', () => {
    it('should return true for main issues page', () => {
      window.location = new URL('https://github.com/owner/repo/issues') as any
      expect(isGitHubIssuesPage()).toBe(true)
    })

    it('should return true for issues page with query parameters', () => {
      window.location = new URL('https://github.com/owner/repo/issues?q=is%3Aissue') as any
      expect(isGitHubIssuesPage()).toBe(true)
    })

    it('should return true for specific issue pages', () => {
      window.location = new URL('https://github.com/owner/repo/issues/123') as any
      expect(isGitHubIssuesPage()).toBe(true)
    })

    it('should return false for non-issues pages', () => {
      window.location = new URL('https://github.com/owner/repo/pulls') as any
      expect(isGitHubIssuesPage()).toBe(false)
    })
  })

  describe('isIssueDetailPage', () => {
    it('should return true for specific issue page', () => {
      window.location = new URL('https://github.com/owner/repo/issues/123') as any
      expect(isIssueDetailPage()).toBe(true)
    })

    it('should return false for main issues page', () => {
      window.location = new URL('https://github.com/owner/repo/issues') as any
      expect(isIssueDetailPage()).toBe(false)
    })

    it('should return false for issues with query parameters', () => {
      window.location = new URL('https://github.com/owner/repo/issues?q=is%3Aissue') as any
      expect(isIssueDetailPage()).toBe(false)
    })

    it('should return false for non-numeric issue IDs', () => {
      window.location = new URL('https://github.com/owner/repo/issues/abc') as any
      expect(isIssueDetailPage()).toBe(false)
    })
  })
})
