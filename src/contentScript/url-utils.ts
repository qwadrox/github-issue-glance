export function isGitHubIssuesPage(): boolean {
  const pattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues(?:\/.*|\?.*)?$/
  return pattern.test(window.location.href)
}

export function isIssueDetailPage(): boolean {
  const pattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/
  return pattern.test(window.location.href)
}

export function getRepoNameFromUrl(): string {
  const match = window.location.href.match(/github\.com\/([^/]+\/[^/]+)/)
  return match ? match[1] : ''
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified delay has elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): {
  (...args: Parameters<T>): void
  cancel: () => void
} {
  let timeoutId: number | null = null

  const debouncedFunction = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = window.setTimeout(() => {
      timeoutId = null
      func(...args)
    }, delay)
  }

  debouncedFunction.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debouncedFunction
}
