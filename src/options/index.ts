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
import { StarredIssue, StorageData } from '../interfaces/interfaces'
import './index.css'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule, TextFilterModule } from 'ag-grid-community'

const modules = [ClientSideRowModelModule, ColumnAutoSizeModule, TextFilterModule]

if (import.meta.env.DEV) {
  modules.push(ValidationModule)
}

ModuleRegistry.registerModules(modules)

import { colorSchemeDark } from 'ag-grid-community'

const myTheme = themeQuartz.withPart(colorSchemeDark)
class IssueManager {
  private issues: StarredIssue[] = []
  private gridApi: GridApi<StarredIssue> | undefined
  constructor() {
    const columnDefs: ColDef[] = [
      {
        field: 'title',
        sortable: true,
        filter: true,
        flex: 2,
      },
      {
        field: 'timestamp',
        sortable: true,
        flex: 1,
        headerName: 'Date',
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

    const gridOptions: GridOptions<StarredIssue> = {
      theme: myTheme,
      columnDefs,
      rowData: [],
      defaultColDef: {
        resizable: true,
      },
      domLayout: 'autoHeight',
      onGridReady: (params) => {
        this.gridApi = params.api // Store the API reference
        this.loadIssues() // Load data once grid is ready
      },
    }

    // Initialize the grid
    const gridDiv = document.querySelector<HTMLElement>('#issues-container')
    if (gridDiv) {
      this.gridApi = createGrid(gridDiv, gridOptions)
    }

    // Listen for delete events
    document.addEventListener('deleteIssue', ((e: CustomEvent) => {
      this.deleteIssue(e.detail)
    }) as EventListener)
  }

  async loadIssues(): Promise<void> {
    const storage = (await chrome.storage.local.get('starredIssues')) as StorageData
    const starredIssues = storage.starredIssues || {}

    this.issues = Object.values(starredIssues).filter((issue) => issue.starred)

    this.updateGrid()
  }

  async deleteIssue(id: string): Promise<void> {
    const storage = (await chrome.storage.local.get('starredIssues')) as StorageData
    const starredIssues = storage.starredIssues || {}

    delete starredIssues[id]

    await chrome.storage.local.set({ starredIssues })
    this.issues = this.issues.filter((issue) => issue.id !== id)
    this.updateGrid()
  }

  private updateGrid(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.issues)
      this.gridApi.sizeColumnsToFit()
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const manager = new IssueManager()
  manager.loadIssues()
})
