import { isGitHubIssuesPage, isIssueDetailPage, debounce } from './url-utils'
import { IssueService } from './services/issue-service'

class GitHubIssueManager {
  private issueService: IssueService
  private pageObserver: MutationObserver | null = null
  private isRendering = false
  private shouldRenderAgain = false
  private readonly scheduleRender: ReturnType<typeof debounce>

  constructor() {
    this.issueService = IssueService.getInstance()
    this.scheduleRender = debounce(() => {
      void this.renderCurrentPage()
    }, 100)
  }

  start(): void {
    this.observePageChanges()
    this.observeNavigationEvents()
    this.refresh()
  }

  refresh = (): void => {
    this.scheduleRender.cancel()
    this.scheduleRender()
  }

  private observePageChanges(): void {
    if (this.pageObserver) {
      return
    }

    this.pageObserver = new MutationObserver((mutations) => {
      if (!this.hasRelevantMutation(mutations)) {
        return
      }

      this.refresh()
    })

    this.pageObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  private hasRelevantMutation(mutations: MutationRecord[]): boolean {
    return mutations.some((mutation) => {
      if (mutation.type !== 'childList') {
        return false
      }

      if (mutation.addedNodes.length === 0 && mutation.removedNodes.length === 0) {
        return false
      }

      return [...mutation.addedNodes, ...mutation.removedNodes].some(
        (node) => node.nodeType === Node.ELEMENT_NODE,
      )
    })
  }

  private observeNavigationEvents(): void {
    window.addEventListener('popstate', this.refresh)
    window.addEventListener('hashchange', this.refresh)
    document.addEventListener('pjax:end', this.refresh)
    document.addEventListener('turbo:load', this.refresh)
    document.addEventListener('turbo:render', this.refresh)
    this.patchHistoryMethod('pushState')
    this.patchHistoryMethod('replaceState')
  }

  private patchHistoryMethod(methodName: 'pushState' | 'replaceState'): void {
    const historyMethod = window.history[methodName] as History['pushState'] & {
      __githubIssueGlancePatched__?: boolean
    }
    if (historyMethod.__githubIssueGlancePatched__) {
      return
    }

    const manager = this
    const patchedMethod = function (
      this: History,
      ...args: Parameters<History['pushState']>
    ): ReturnType<History['pushState']> {
      const result = historyMethod.apply(this, args)
      manager.refresh()
      return result
    }

    patchedMethod.__githubIssueGlancePatched__ = true
    window.history[methodName] = patchedMethod as History[typeof methodName]
  }

  private async renderCurrentPage(): Promise<void> {
    if (this.isRendering) {
      this.shouldRenderAgain = true
      return
    }

    this.isRendering = true

    try {
      do {
        this.shouldRenderAgain = false

        if (!isGitHubIssuesPage()) {
          continue
        }

        if (isIssueDetailPage()) {
          await this.issueService.modifyIssueDetailPage()
          continue
        }

        await this.issueService.modifyIssuesListPage()
      } while (this.shouldRenderAgain)
    } catch (error) {
      console.error('Failed to render GitHub Issue Glance UI', error)
    } finally {
      this.isRendering = false
    }
  }
}

const manager = new GitHubIssueManager()
manager.start()

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsChanged') {
    IssueService.getInstance().updateSettings(message.settings)
    manager.refresh()
  } else if (message.type === 'issueDeleted') {
    manager.refresh()
  }
})
