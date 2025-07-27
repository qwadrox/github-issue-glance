import { defaultSettings } from '../../constants'
import { FeatureSettings, StorageData, StorageItem } from '../../interfaces/interfaces'
import { getRepoNameFromUrl } from '../url-utils'

export class StorageService {
  async getData(): Promise<StorageData> {
    try {
      const storage = (await chrome.storage.local.get('data')) as StorageData
      return storage
    } catch (error) {
      console.error('Error fetching storage data:', error)
      return { data: [] }
    }
  }

  async getRepoData(): Promise<StorageItem | undefined> {
    const repoName = getRepoNameFromUrl()
    const storage = await this.getData()
    return storage.data?.find((item) => item.repoName === repoName)
  }

  async updateIssue(
    issueId: string,
    issueData: {
      title?: string
      url?: string
      starred?: boolean
      visited?: boolean
    },
  ): Promise<void> {
    try {
      const storage = await this.getData()
      const data = storage.data || []
      const repoName = getRepoNameFromUrl()
      let repoData = data.find((item) => item.repoName === repoName)
      if (!repoData) {
        repoData = { repoName, issues: {} }
        data.push(repoData)
      }

      repoData.issues[issueId] = {
        ...repoData.issues[issueId],
        id: issueId,
        timestamp: Date.now(),
        ...issueData,
      }

      await chrome.storage.local.set({ data })
    } catch (error) {
      console.error('Error updating issue:', error)
    }
  }

  async toggleIssueStarred(issueId: string, title: string, url: string): Promise<boolean> {
    const repoData = await this.getRepoData()
    const isCurrentlyStarred = repoData?.issues[issueId]?.starred || false

    await this.updateIssue(issueId, {
      title,
      url,
      starred: !isCurrentlyStarred,
    })

    return !isCurrentlyStarred
  }

  async markIssueAsVisited(issueId: string, title: string, url: string): Promise<void> {
    await this.updateIssue(issueId, {
      title,
      url,
      visited: true,
    })
  }

  async retrieveSettings(): Promise<FeatureSettings> {
    const storage = await chrome.storage.local.get('settings')
    return storage.settings || defaultSettings
  }
}
