import { StorageData } from '../interfaces/interfaces'
import { getRepoNameFromUrl, isGitHubIssuesPage, isIssueDetailPage } from './url-utils'

function createStarIcon(isDetailPage: boolean): HTMLElement {
  const star = document.createElement('span')
  star.innerHTML = '★'
  star.style.cursor = 'pointer'
  star.style.marginRight = isDetailPage ? '0px' : '8px'
  star.style.fontSize = isDetailPage ? '1.8rem' : '16px'
  star.style.verticalAlign = isDetailPage ? 'text-bottom' : 'middle'
  return star
}

async function toggleStar(issueId: string, starElement: HTMLElement): Promise<void> {
  const storage = (await chrome.storage.local.get('data')) as StorageData
  const data = storage.data || []
  const repoName = getRepoNameFromUrl()
  
  let repoData = data.find(item => item.repoName === repoName)
  if (!repoData) {
    repoData = { repoName, starredIssues: {} }
    data.push(repoData)
  }

  const isStarred = repoData.starredIssues[issueId]?.starred

  const titleElement = starElement.nextElementSibling as HTMLAnchorElement

  repoData.starredIssues[issueId] = {
    id: issueId,
    title: titleElement?.textContent || 'Untitled Issue',
    url: titleElement?.href || window.location.href,
    starred: !isStarred,
    timestamp: Date.now(),
  }

  await chrome.storage.local.set({ data })
  updateStarAppearance(starElement, !isStarred)
}


function updateStarAppearance(starElement: HTMLElement, isStarred: boolean): void {
  starElement.style.color = isStarred ? '#e3b341' : '#ccc'
}

async function addStarsToIssues(): Promise<void> {
  const issueElements = document.querySelectorAll('div[id^="issue_"]')
  for (const element of issueElements) {
    await addStarToIssue(element)
  }
}

async function addStarToIssue(element: Element): Promise<void> {
  const issueId = element.id
  if (!issueId) return

  const existingStars = element.getElementsByClassName('github-issue-star')
  if (existingStars.length > 0) {
    for (let i = 1; i < existingStars.length; i++) {
      existingStars[i].remove()
    }
    return
  }

  const star = createStarIcon(false)
  star.classList.add('github-issue-star')

  const storage = (await chrome.storage.local.get('data')) as StorageData
  const data = storage.data || []
  const repoName = getRepoNameFromUrl()
  const repoData = data.find(item => item.repoName === repoName)
  
  updateStarAppearance(star, repoData?.starredIssues[issueId]?.starred || false)

  star.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleStar(issueId, star)
  })

  const titleElement = element.querySelector('a')
  if (titleElement) {
    titleElement.before(star)
  }
}

async function addStarToIssueDetailPage(): Promise<void> {
  // Get issue ID from the title span
  const titleSpan = document.querySelector('.gh-header-title .f1-light')
  const issueId = 'issue_' + titleSpan?.textContent?.replace('#', '').trim()
  if (!issueId) return

  const existingStars = document.getElementsByClassName('github-issue-star')
  if (existingStars.length > 0) {
    for (let i = 1; i < existingStars.length; i++) {
      existingStars[i].remove()
    }
    return
  }

  const star = createStarIcon(true)
  star.classList.add('github-issue-star')

  const storage = (await chrome.storage.local.get('data')) as StorageData
  const data = storage.data || []
  const repoName = getRepoNameFromUrl()
  const repoData = data.find(item => item.repoName === repoName)

  updateStarAppearance(star, repoData?.starredIssues[issueId]?.starred || false)

  star.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleStar(issueId, star)
  })

  const titleElement = document.querySelector('.gh-header-title')
  if (titleElement) {
    titleElement.insertAdjacentElement('afterbegin', star)
  }
}

function observeUrlChanges(): void {
  document.addEventListener('turbo:load', () => {
    if (isGitHubIssuesPage()) {
      if (isIssueDetailPage()) {
        addStarToIssueDetailPage()
      } else {
        addStarsToIssues()
      }
    }
  })
}

function initialize(): void {
  if (isGitHubIssuesPage()) {
    if (isIssueDetailPage()) {
      addStarToIssueDetailPage()
    } else {
      addStarsToIssues()
    }
  }
  observeUrlChanges()
}

initialize()