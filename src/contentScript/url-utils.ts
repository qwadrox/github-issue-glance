export function isGitHubIssuesPage(): boolean {
  const pattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues(?:\/.*|\?.*)?$/
  return pattern.test(window.location.href)
}

export function isIssueDetailPage(): boolean {
  // Match URLs like: https://github.com/owner/repo/issues/123
  const pattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/
  return pattern.test(window.location.href)
}
