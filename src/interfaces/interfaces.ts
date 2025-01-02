export interface StarredIssue {
  id: string
  title: string
  url: string
  starred: boolean
  timestamp: number
}

export interface StorageData {
  starredIssues: { [key: string]: StarredIssue }
}
