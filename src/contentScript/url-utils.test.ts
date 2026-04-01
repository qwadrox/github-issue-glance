import { getRepoNameFromUrl, isGitHubIssuesPage, isIssueDetailPage, debounce } from './url-utils'

describe('GitHub URL Validators', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', 'https://github.com/owner/repo/issues')
  })

  describe('isGitHubIssuesPage', () => {
    it('should return true for main issues page', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues')
      expect(isGitHubIssuesPage()).toBe(true)
    })

    it('should return true for issues page with query parameters', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues?q=is%3Aissue')
      expect(isGitHubIssuesPage()).toBe(true)
    })

    it('should return true for specific issue pages', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues/123')
      expect(isGitHubIssuesPage()).toBe(true)
    })

    it('should return true for issue pages with hash fragments', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues#top')
      expect(isGitHubIssuesPage()).toBe(true)
    })

    it('should return false for non-issues pages', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/pulls')
      expect(isGitHubIssuesPage()).toBe(false)
    })
  })

  describe('isIssueDetailPage', () => {
    it('should return true for specific issue page', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues/123')
      expect(isIssueDetailPage()).toBe(true)
    })

    it('should return true for issue detail pages with query parameters and hash fragments', () => {
      window.history.replaceState(
        {},
        '',
        'https://github.com/owner/repo/issues/123?focused=true#issuecomment-1',
      )
      expect(isIssueDetailPage()).toBe(true)
    })

    it('should return false for main issues page', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues')
      expect(isIssueDetailPage()).toBe(false)
    })

    it('should return false for issues with query parameters', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues?q=is%3Aissue')
      expect(isIssueDetailPage()).toBe(false)
    })

    it('should return false for non-numeric issue IDs', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues/abc')
      expect(isIssueDetailPage()).toBe(false)
    })
  })

  describe('getRepoNameFromUrl', () => {
    it('should return the repo name from the URL', () => {
      window.history.replaceState({}, '', 'https://github.com/owner/repo/issues')
      expect(getRepoNameFromUrl()).toBe('owner/repo')
    })
  })
})

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should delay function execution', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(50)
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(50)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should reset the timer on subsequent calls', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    jest.advanceTimersByTime(50)

    debouncedFn() // This should reset the timer
    jest.advanceTimersByTime(50)
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(50)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments correctly', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('arg1', 'arg2')
    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should cancel pending executions', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    jest.advanceTimersByTime(50)

    debouncedFn.cancel()
    jest.advanceTimersByTime(100)

    expect(mockFn).not.toHaveBeenCalled()
  })

  it('should handle multiple cancellations safely', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn.cancel() // Should not throw when no timer is active

    debouncedFn()
    debouncedFn.cancel()
    debouncedFn.cancel() // Should not throw when already cancelled

    expect(mockFn).not.toHaveBeenCalled()
  })
})
