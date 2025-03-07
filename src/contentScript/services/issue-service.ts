import { StorageService } from './storage-service'
import { StarIcon } from '../components/star-icon'
import { FeatureSettings, StorageItem } from '../../interfaces/interfaces'

export class IssueService {
  private static instance: IssueService
  private storageService: StorageService
  private settings!: FeatureSettings

  private constructor() {
    this.storageService = new StorageService()
    this.initializeSettings()
  }

  private async initializeSettings(): Promise<void> {
    this.settings = await this.storageService.retrieveSettings()
  }

  static getInstance(): IssueService {
    if (!IssueService.instance) {
      IssueService.instance = new IssueService()
    }
    return IssueService.instance
  }

  public updateSettings(settings: FeatureSettings): void {
    this.settings = settings
  }

  async modifyIssue(element: Element, repoData: StorageItem | undefined): Promise<void> {
    const issueId = this.extractIssueIdFromElement(element)
    if (!issueId) return

    if (this.settings.markVisited) {
      this.updateIssueTitle(element, repoData?.issues[issueId]?.visited)
    }

    const existingStars = element.getElementsByClassName('github-issue-star')
    for (let i = 1; i < existingStars.length; i++) {
      existingStars[i].remove()
    }

    let starIcon: StarIcon
    if (existingStars.length > 0) {
      const existingStarElement = existingStars[0] as HTMLElement
      existingStarElement.remove()
    }

    starIcon = new StarIcon(false)
    const titleElement = element.querySelector('h3 > a')
    if (titleElement) {
      titleElement.before(starIcon.getElement())
    }

    starIcon.setStarred(repoData?.issues[issueId]?.starred || false)
    starIcon.onClick(() => this.toggleStar(issueId, starIcon, titleElement))
  }

  private extractIssueIdFromElement(element: Element): string {
    const titleLink = element.querySelector('a[href*="/issues/"]') as HTMLAnchorElement
    if (titleLink && titleLink.href) {
      const match = titleLink.href.match(/\/issues\/(\d+)/)
      if (match && match[1]) {
        return `issue_${match[1]}`
      }
    }

    return ''
  }

  private async toggleStar(
    issueId: string,
    starIcon: StarIcon,
    titleElement: Element | null,
  ): Promise<void> {
    const isStarred = await this.storageService.toggleIssueStarred(
      issueId,
      titleElement?.textContent || 'Untitled Issue',
      (titleElement as HTMLAnchorElement)?.href || window.location.href,
    )
    starIcon.setStarred(isStarred)
  }

  private updateIssueTitle(element: Element, isVisited: boolean | undefined): void {
    const issueTitle = element.querySelector('h3 > a') as HTMLElement
    if (isVisited && issueTitle) {
      issueTitle.style.cssText = `text-decoration: underline !important; color: ${this.settings.markVisitedColor} !important;`
    }
  }

  async modifyIssueDetailPage(): Promise<void> {
    const titleIssueSpan = document.querySelector('[data-component="PH_Title"] > span')
    const titleElement = document.querySelector('[data-component="PH_Title"]')

    if (!titleIssueSpan || !titleElement)
      throw new Error('Title issue span or title element not found')

    const issueId = 'issue_' + titleIssueSpan?.textContent?.replace('#', '').trim()
    if (!issueId) return

    const existingStars = document.getElementsByClassName('github-issue-star')
    if (existingStars.length > 0) {
      for (let i = 1; i < existingStars.length; i++) {
        existingStars[i].remove()
      }
      return
    }

    const starIcon = new StarIcon(true)
    const repoData = await this.storageService.getRepoData()

    starIcon.setStarred(repoData?.issues[issueId]?.starred || false)

    starIcon.onClick(() => {
      this.toggleStar(issueId, starIcon, titleElement)
    })

    if (titleElement) {
      titleElement.insertAdjacentElement('afterbegin', starIcon.getElement())
      ;(titleElement as HTMLElement).style.display = 'flex'
    }

    if (this.settings.markVisited && !repoData?.issues[issueId]?.visited) {
      await this.markIssueAsVisited(issueId, titleElement)
    }
  }

  private async markIssueAsVisited(issueId: string, titleElement: Element | null): Promise<void> {
    if (!titleElement) return

    await this.storageService.markIssueAsVisited(
      issueId,
      titleElement.textContent?.trim() || 'Untitled Issue',
      window.location.href,
    )
  }
}
