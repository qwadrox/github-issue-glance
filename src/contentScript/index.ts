import { isGitHubIssuesPage, isIssueDetailPage, debounce } from './url-utils'
import { IssueService } from './services/issue-service'
import { StorageService } from './services/storage-service'
import { StorageItem } from '../interfaces/interfaces'

class GitHubIssueManager {
  private issueService: IssueService
  private storageService: StorageService
  private issuesListObserver: MutationObserver | null = null
  private contentObserver: MutationObserver | null = null

  constructor() {
    this.issueService = IssueService.getInstance()
    this.storageService = new StorageService()
  }

  async modifyIssuesPage(): Promise<void> {
    const issuesList = document.querySelectorAll('[data-listview-component="items-list"]')[0]
    if (!issuesList || issuesList.children.length === 0) {
      return
    }

    this.setupIssuesListObserver(issuesList)

    const repoData = await this.storageService.getRepoData()
    for (const element of issuesList.children) {
      await this.processIssueElement(element, repoData)
    }
  }

  private setupIssuesListObserver(issuesList: Element): void {
    if (this.issuesListObserver) {
      this.issuesListObserver.disconnect()
    }

    this.issuesListObserver = new MutationObserver(async (mutations) => {
      const repoData = await this.storageService.getRepoData()

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.querySelector('a[href*="/issues/"]') || element.querySelector('h3 a')) {
                await this.processIssueElement(element, repoData)
              }
            }
          }
        }
      }
    })

    this.issuesListObserver.observe(issuesList, {
      childList: true,
      subtree: false,
    })
  }

  async initialize(): Promise<void> {
    if (!isGitHubIssuesPage()) {
      this.disconnectObservers()
      return
    }

    if (isIssueDetailPage()) {
      await this.waitForIssueDetailAndProcess()
    } else {
      await this.waitForIssuesListAndProcess()
    }
  }

  private disconnectObservers(): void {
    if (this.issuesListObserver) {
      this.issuesListObserver.disconnect()
      this.issuesListObserver = null
    }
    if (this.contentObserver) {
      this.contentObserver.disconnect()
      this.contentObserver = null
    }
  }

  private async waitForIssueDetailAndProcess(): Promise<void> {
    const titleElement = document.querySelector('[data-component="PH_Title"]')
    if (titleElement) {
      await this.issueService.modifyIssueDetailPage()
      return
    }

    return new Promise((resolve) => {
      // Target the main content area instead of entire document
      const targetContainer = document.querySelector('main') || document.body

      this.contentObserver = new MutationObserver(async (mutations) => {
        const titleElement = document.querySelector('[data-component="PH_Title"]')
        if (titleElement) {
          this.contentObserver?.disconnect()
          this.contentObserver = null
          await this.issueService.modifyIssueDetailPage()
          resolve()
        }
      })

      this.contentObserver.observe(targetContainer, {
        childList: true,
        subtree: true,
      })
    })
  }

  private async waitForIssuesListAndProcess(): Promise<void> {
    const issuesList = document.querySelectorAll('[data-listview-component="items-list"]')[0]
    if (issuesList && issuesList.children.length > 0) {
      await this.modifyIssuesPage()
      return
    }

    return new Promise((resolve) => {
      const targetContainer = document.querySelector('main') || document.body

      this.contentObserver = new MutationObserver(async (mutations) => {
        const issuesList = document.querySelectorAll('[data-listview-component="items-list"]')[0]
        if (issuesList && issuesList.children.length > 0) {
          this.contentObserver?.disconnect()
          this.contentObserver = null
          await this.modifyIssuesPage()
          resolve()
        }
      })

      this.contentObserver.observe(targetContainer, {
        childList: true,
        subtree: true,
      })
    })
  }

  private async processIssueElement(
    element: Element,
    repoData: StorageItem | undefined,
  ): Promise<void> {
    const existingStars = element.getElementsByClassName('github-issue-star')
    if (existingStars.length > 0) {
      return
    }

    await this.issueService.modifyIssue(element, repoData)
  }

  observeUrlChanges(): void {
    let lastUrl = window.location.href

    const debouncedInitialize = debounce(async () => {
      await this.initialize()
    }, 50)

    const observer = new MutationObserver(async (mutations) => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href

        this.disconnectObservers()
        debouncedInitialize.cancel()
        debouncedInitialize()
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
  } else if (message.type === 'issueDeleted') {
    window.location.reload()
  }
})
