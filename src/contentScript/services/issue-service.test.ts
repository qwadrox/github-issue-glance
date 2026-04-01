const setLocation = (url: string) => {
  window.history.replaceState({}, '', url)
}

const createChromeMock = () => {
  const get = jest.fn(async (key: string) => {
    if (key === 'settings') {
      return {
        settings: {
          markVisited: true,
          markVisitedColor: '#ff00aa',
        },
      }
    }

    if (key === 'data') {
      return {
        data: [
          {
            repoName: 'owner/repo',
            issues: {
              issue_42: {
                id: 'issue_42',
                title: 'Issue 42',
                url: 'https://github.com/owner/repo/issues/42',
                starred: true,
                timestamp: 1,
                visited: true,
              },
            },
          },
        ],
      }
    }

    return {}
  })
  const set = jest.fn(async () => undefined)

  ;(globalThis as any).chrome = {
    storage: {
      local: {
        get,
        set,
      },
    },
  }

  return { get, set }
}

const createIssueRowMarkup = () => `
  <main>
    <ul>
      <li role="listitem">
        <div data-listview-item-title-container="true">
          <h3>
            <a data-testid="issue-pr-title-link" href="/owner/repo/issues/42">Issue 42</a>
          </h3>
        </div>
      </li>
    </ul>
  </main>
`

describe('IssueService', () => {
  beforeEach(() => {
    jest.resetModules()
    document.body.innerHTML = ''
  })

  it('renders list stars idempotently across repeated renders and container replacement', async () => {
    createChromeMock()
    setLocation('https://github.com/owner/repo/issues')
    document.body.innerHTML = createIssueRowMarkup()

    const { IssueService } = await import('./issue-service')
    const issueService = IssueService.getInstance()

    await issueService.modifyIssuesListPage()
    await issueService.modifyIssuesListPage()

    expect(document.querySelectorAll('.github-issue-star')).toHaveLength(1)
    expect(document.querySelector('.github-issue-star')?.getAttribute('aria-pressed')).toBe('true')

    const titleLink = document.querySelector(
      'a[data-testid="issue-pr-title-link"]',
    ) as HTMLAnchorElement
    expect(titleLink.style.getPropertyValue('text-decoration')).toBe('underline')
    expect(titleLink.style.getPropertyValue('color')).not.toBe('')

    document.body.innerHTML = createIssueRowMarkup()
    await issueService.modifyIssuesListPage()

    expect(document.querySelectorAll('.github-issue-star')).toHaveLength(1)
  })

  it('renders detail stars idempotently on repeat visits to the same issue page', async () => {
    createChromeMock()
    setLocation('https://github.com/owner/repo/issues/42')
    document.body.innerHTML = `
      <main>
        <h1 data-component="PH_Title">
          <bdi data-testid="issue-title">Issue 42</bdi>
          <span>#42</span>
        </h1>
      </main>
    `

    const { IssueService } = await import('./issue-service')
    const issueService = IssueService.getInstance()

    await issueService.modifyIssueDetailPage()
    await issueService.modifyIssueDetailPage()

    const titleElement = document.querySelector('h1[data-component="PH_Title"]') as HTMLElement
    expect(titleElement.querySelectorAll('.github-issue-star')).toHaveLength(1)
    expect(titleElement.firstElementChild?.classList.contains('github-issue-star')).toBe(true)
  })
})
