import { StorageService } from './storage-service'
import { StarIcon } from '../components/star-icon'
import { FeatureSettings, StorageItem } from '../../interfaces/interfaces'
import { defaultSettings } from '../../constants'

const LIST_ROW_SELECTOR = 'main li[role="listitem"]'
const LIST_TITLE_LINK_SELECTOR = 'a[data-testid="issue-pr-title-link"][href*="/issues/"]'
const LIST_TITLE_FALLBACK_SELECTOR = 'h3 a[href*="/issues/"]'
const DETAIL_TITLE_SELECTOR = 'h1[data-component="PH_Title"]'
const DETAIL_TITLE_TEXT_SELECTOR = '[data-testid="issue-title"]'
const STAR_SELECTOR = '.github-issue-star'

export class IssueService {
  private static instance: IssueService
  private storageService: StorageService
  private settings: FeatureSettings
  private settingsPromise: Promise<void>

  private constructor() {
    this.storageService = new StorageService()
    this.settings = defaultSettings
    this.settingsPromise = this.initializeSettings()
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

  async modifyIssuesListPage(): Promise<void> {
    await this.settingsPromise

    const repoData = await this.storageService.getRepoData()
    const issueElements = this.getIssueElements()

    for (const element of issueElements) {
      this.renderIssueRow(element, repoData)
    }
  }

  private getIssueElements(): Element[] {
    return Array.from(document.querySelectorAll(LIST_ROW_SELECTOR)).filter((element) =>
      Boolean(this.getIssueTitleLink(element)),
    )
  }

  private renderIssueRow(element: Element, repoData: StorageItem | undefined): void {
    const titleLink = this.getIssueTitleLink(element)
    if (!titleLink) return

    const issueId = this.extractIssueIdFromHref(titleLink.href)
    if (!issueId) return

    this.updateIssueTitle(titleLink, repoData?.issues[issueId]?.visited)

    const starIcon = this.ensureListStar(element, titleLink, issueId)
    const isStarred = repoData?.issues[issueId]?.starred || false

    starIcon.setStarred(isStarred)
    starIcon.setClickHandler(() => {
      void this.toggleStar(issueId, starIcon, titleLink)
    })
  }

  private getIssueTitleLink(element: ParentNode): HTMLAnchorElement | null {
    return (element.querySelector(LIST_TITLE_LINK_SELECTOR) ||
      element.querySelector(LIST_TITLE_FALLBACK_SELECTOR)) as HTMLAnchorElement | null
  }

  private ensureListStar(
    element: Element,
    titleLink: HTMLAnchorElement,
    issueId: string,
  ): StarIcon {
    const existingStars = Array.from(element.querySelectorAll<HTMLButtonElement>(STAR_SELECTOR))
    const reusableStarElement = existingStars[0]
    const starIcon = reusableStarElement
      ? StarIcon.fromElement(reusableStarElement, false)
      : new StarIcon(false)
    const starElement = starIcon.getElement()

    starElement.dataset.issueId = issueId
    if (
      starElement.parentElement !== titleLink.parentElement ||
      starElement.nextElementSibling !== titleLink
    ) {
      titleLink.before(starElement)
    }

    for (const extraStar of existingStars) {
      if (extraStar !== starElement) {
        extraStar.remove()
      }
    }

    return starIcon
  }

  private extractIssueIdFromHref(href: string): string {
    const normalizedHref = href.startsWith('http')
      ? href
      : new URL(href, window.location.origin).href
    const match = normalizedHref.match(/\/issues\/(\d+)/)

    return match?.[1] ? `issue_${match[1]}` : ''
  }

  private async toggleStar(
    issueId: string,
    starIcon: StarIcon,
    titleElement: Element | null,
  ): Promise<void> {
    const isStarred = await this.storageService.toggleIssueStarred(
      issueId,
      titleElement?.textContent?.trim() || 'Untitled Issue',
      (titleElement as HTMLAnchorElement)?.href || window.location.href,
    )
    starIcon.setStarred(isStarred)
  }

  private updateIssueTitle(issueTitle: HTMLElement, isVisited: boolean | undefined): void {
    if (this.settings.markVisited && isVisited) {
      issueTitle.style.setProperty('text-decoration', 'underline', 'important')
      issueTitle.style.setProperty('color', this.settings.markVisitedColor, 'important')
      return
    }

    issueTitle.style.removeProperty('text-decoration')
    issueTitle.style.removeProperty('color')
  }

  async modifyIssueDetailPage(): Promise<void> {
    await this.settingsPromise

    const titleElement = document.querySelector(DETAIL_TITLE_SELECTOR) as HTMLElement | null
    const titleTextElement = titleElement?.querySelector(
      DETAIL_TITLE_TEXT_SELECTOR,
    ) as HTMLElement | null

    if (!titleElement) {
      return
    }

    const issueId = this.extractIssueIdFromHref(window.location.href)
    if (!issueId) return

    const repoData = await this.storageService.getRepoData()
    const starIcon = this.ensureDetailStar(titleElement, titleTextElement, issueId)

    starIcon.setStarred(repoData?.issues[issueId]?.starred || false)
    starIcon.setClickHandler(() => {
      void this.toggleStar(issueId, starIcon, titleTextElement || titleElement)
    })

    if (this.settings.markVisited && !repoData?.issues[issueId]?.visited) {
      await this.markIssueAsVisited(issueId, titleTextElement || titleElement)
    }
  }

  private ensureDetailStar(
    titleElement: HTMLElement,
    titleTextElement: HTMLElement | null,
    issueId: string,
  ): StarIcon {
    const existingStars = Array.from(
      titleElement.querySelectorAll<HTMLButtonElement>(STAR_SELECTOR),
    )
    const reusableStarElement = existingStars[0]
    const starIcon = reusableStarElement
      ? StarIcon.fromElement(reusableStarElement, true)
      : new StarIcon(true)
    const starElement = starIcon.getElement()

    starElement.dataset.issueId = issueId
    const insertionTarget = titleTextElement || titleElement.firstElementChild || titleElement
    if (
      starElement.parentElement !== insertionTarget.parentElement ||
      starElement.nextElementSibling !== insertionTarget
    ) {
      insertionTarget.before(starElement)
    }

    for (const extraStar of existingStars) {
      if (extraStar !== starElement) {
        extraStar.remove()
      }
    }

    return starIcon
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
