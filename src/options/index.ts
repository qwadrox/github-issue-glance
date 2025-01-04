import {
  createGrid,
  GridOptions,
  ColDef,
  GridApi,
  ColumnAutoSizeModule,
  themeBalham,
  themeQuartz,
  ValidationModule,
} from 'ag-grid-community'
import { Issue, StorageData } from '../interfaces/interfaces'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule, TextFilterModule, DateFilterModule } from 'ag-grid-community'
import { colorSchemeDark } from 'ag-grid-community'
import { setupRouting } from './routing'
import { SettingsManager } from './settings/settings-manager'
import { createSettingsUI } from './settings/settings-ui'
import { notifyContentScripts } from './notify'

const modules = [ClientSideRowModelModule, ColumnAutoSizeModule, TextFilterModule, DateFilterModule]

if (import.meta.env.DEV) {
  modules.push(ValidationModule)
}

ModuleRegistry.registerModules(modules)

const myTheme = themeQuartz.withPart(colorSchemeDark)

class IssueOptionsManager {
  private issues: Issue[] = []
  private gridApi: GridApi<Issue> | undefined
  private repoFilter: HTMLSelectElement | null = null
  private currentRepoName: string = ''

  constructor() {
    const columnDefs: ColDef[] = [
      {
        field: 'title',
        sortable: true,
        filter: true,
        flex: 2,
      },
      {
        field: 'repoName',
        sortable: true,
        filter: true,
        flex: 1,
        headerName: 'Repository',
      },
      {
        field: 'timestamp',
        sortable: true,
        flex: 1,
        headerName: 'Date',
        filter: 'agDateColumnFilter',
        valueFormatter: (params) => new Date(params.value).toLocaleString(),
      },
      {
        headerName: 'Actions',
        flex: 1,
        cellRenderer: (params: any) => {
          const container = document.createElement('div')
          container.classList.add('pico')
          const viewLink = document.createElement('a')
          viewLink.href = params.data.url
          viewLink.target = '_blank'
          viewLink.textContent = 'View'

          const separator = document.createTextNode(' | ')

          const deleteButton = document.createElement('button')
          deleteButton.textContent = 'Delete'
          deleteButton.addEventListener('click', () => {
            document.dispatchEvent(
              new CustomEvent('deleteIssue', {
                detail: params.data.id,
              }),
            )
          })

          container.appendChild(viewLink)
          container.appendChild(separator)
          container.appendChild(deleteButton)

          return container
        },
      },
    ]

    const gridOptions: GridOptions<Issue> = {
      theme: myTheme,
      columnDefs,
      rowData: [],
      defaultColDef: {
        resizable: true,
      },
      domLayout: 'autoHeight',
      onGridReady: (params) => {
        this.gridApi = params.api
        this.loadIssues()
      },
    }

    this.repoFilter = document.querySelector('#repo-filter')

    this.repoFilter?.addEventListener('change', (e) => {
      this.currentRepoName = (e.target as HTMLSelectElement).value
      this.updateGrid()
    })

    const gridDiv = document.querySelector<HTMLElement>('#grid-container')
    if (gridDiv) {
      this.gridApi = createGrid(gridDiv, gridOptions)
    }

    document.addEventListener('deleteIssue', ((e: CustomEvent) => {
      this.deleteIssue(e.detail)
    }) as EventListener)

    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.clearFilters()
    })

    document.getElementById('clear-all')?.addEventListener('click', () => {
      this.clearAll()
    })

    document.getElementById('refresh-data')?.addEventListener('click', () => {
      this.loadIssues()
    })
  }

  private clearFilters(): void {
    this.currentRepoName = ''
    if (this.repoFilter) {
      this.repoFilter.value = ''
    }
    this.gridApi?.setFilterModel(null)
    this.updateGrid()
  }

  private async clearAll(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to clear all data? This action cannot be undone.',
    )
    if (!confirmed) return

    this.issues = []
    await chrome.storage.local.set({ data: [] })
    notifyContentScripts({
      type: 'issueDeleted',
    })
    this.updateGrid()
    this.updateRepoFilterOptions({ data: [] })
  }

  private updateRepoFilterOptions(data: StorageData): void {
    if (!this.repoFilter) return

    this.repoFilter.innerHTML = ''

    const defaultOption = document.createElement('option')
    defaultOption.value = ''
    defaultOption.textContent = 'All Repositories'
    this.repoFilter.appendChild(defaultOption)

    const repoNames = [...new Set(data.data.map((item) => item.repoName))]
    repoNames.forEach((repoName) => {
      const option = document.createElement('option')
      option.value = repoName
      option.textContent = repoName
      this.repoFilter?.appendChild(option)
    })
  }

  async loadIssues(): Promise<void> {
    const storage = (await chrome.storage.local.get('data')) as StorageData
    const data = storage.data || []

    this.updateRepoFilterOptions(storage)

    this.issues = data.flatMap((repo) =>
      Object.values(repo.issues)
        .filter((issue) => issue.starred)
        .map((issue) => ({
          ...issue,
          repoName: repo.repoName,
        })),
    )

    this.updateGrid()
  }

  async deleteIssue(id: string): Promise<void> {
    const storage = (await chrome.storage.local.get('data')) as StorageData
    const data = storage.data || []

    for (const repo of data) {
      if (id in repo.issues) {
        delete repo.issues[id]
        notifyContentScripts({
          type: 'issueDeleted',
        })
        break
      }
    }

    await chrome.storage.local.set({ data })
    this.issues = this.issues.filter((issue) => issue.id !== id)
    this.updateGrid()
  }

  private updateGrid(): void {
    if (!this.gridApi) return

    const filteredIssues = this.currentRepoName
      ? this.issues.filter((issue) => issue.repoName === this.currentRepoName)
      : this.issues

    this.gridApi.setGridOption('rowData', filteredIssues)
    this.gridApi.sizeColumnsToFit()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupRouting()
  const manager = new IssueOptionsManager()
  manager.loadIssues()

  const settingsPage = document.getElementById('settings-page')
  if (settingsPage) {
    settingsPage.appendChild(createSettingsUI())
    new SettingsManager()
  }

  if (process.env.NODE_ENV === 'development') {
    const testButton = document.getElementById('testInstall')
    if (testButton) {
      testButton.style.display = 'block'
      testButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'TEST_INSTALL' })
      })
    }
  }
})
