export interface StarredIssue {
  id: string
  title: string
  url: string
  starred: boolean
  timestamp: number
  repoName?: string
}

export interface StorageItem {
  starredIssues: { [key: string]: StarredIssue }
  repoName: string
}

export interface StorageData {
  data: StorageItem[]
}
