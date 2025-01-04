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
