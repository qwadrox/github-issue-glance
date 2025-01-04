export interface Issue {
  id: string
  title: string
  url: string
  starred: boolean
  timestamp: number
  visited: boolean
  repoName?: string
}

export interface StorageItem {
  issues: { [key: string]: Issue }
  repoName: string
}

export interface StorageData {
  data: StorageItem[]
}

export interface FeatureSettings {
  markVisited: boolean
  markVisitedColor: string
}

export interface NotifyMessage {
  type: 'settingsChanged' | 'issueDeleted'

  [key: string]: any
}
