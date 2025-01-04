import { getRepoNameFromUrl, isGitHubIssuesPage, isIssueDetailPage } from './url-utils'
import { IssueService } from './services/issue-service'
import { StorageService } from './services/storage-service'

class GitHubIssueManager {
  private issueService: IssueService

  private storageService: StorageService

  constructor() {
    this.issueService = IssueService.getInstance()
    this.storageService = new StorageService();
  }

  async modifyIssuesPage(): Promise<void> {
    const issueElements = document.querySelectorAll('div[id^="issue_"]')

    const repoData = await this.storageService.getRepoData()
    for (const element of issueElements) {
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
    document.addEventListener('turbo:load', async () => {
      await this.initialize()
    })
  }
}

const manager = new GitHubIssueManager()
manager.initialize()
manager.observeUrlChanges()


chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsChanged')
  {
    console.log(message.settings)
    IssueService.getInstance().updateSettings(message.settings)
    window.location.reload()
  }
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'issueDeleted') {
    window.location.reload()
  }
})
