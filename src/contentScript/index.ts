import { getRepoNameFromUrl, isGitHubIssuesPage, isIssueDetailPage } from './url-utils'
import { IssueService } from './services/issue-service'
import { StorageService } from './services/storage-service'

class GitHubIssueManager {
  private issueService: IssueService

  private storageService: StorageService

  constructor() {
    this.issueService = IssueService.getInstance()
    this.storageService = new StorageService()
  }

  async modifyIssuesPage(): Promise<void> {
    const issuesList = document.querySelectorAll('[data-listview-component="items-list"]')[0]

    if (!issuesList || issuesList.children.length === 0) {
      console.warn('Issues list not found')
      return
    }

    const repoData = await this.storageService.getRepoData()
    for (const element of issuesList.children) {
      await this.issueService.modifyIssue(element, repoData)
    }
  }

  async initialize(): Promise<void> {
    if (!isGitHubIssuesPage()) return

    if (isIssueDetailPage()) {
      await this.issueService.modifyIssueDetailPage()
    } else {
      await this.modifyIssuesPage()
    }
  }

  observeUrlChanges(): void {
    let lastUrl = window.location.href

    const observer = new MutationObserver(async (mutations) => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href

        setTimeout(async () => {
          await this.initialize()
        }, 300)
      }
    })

    observer.observe(document, {
      subtree: true,
      childList: true,
    })
  }
}

const manager = new GitHubIssueManager()
manager.initialize()
manager.observeUrlChanges()

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsChanged') {
    IssueService.getInstance().updateSettings(message.settings)
    window.location.reload()
  }
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'issueDeleted') {
    window.location.reload()
  }
})
