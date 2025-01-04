import { defaultSettings } from '../../contants'
import { FeatureSettings } from '../../interfaces/interfaces'
import { notifyContentScripts } from '../notify'

export class SettingsManager {


  private settings: FeatureSettings = {
    ...defaultSettings
  }

  constructor() {
    this.loadSettings()
    this.setupEventListeners()
  }

  private async loadSettings(): Promise<void> {
    const storage = await chrome.storage.local.get('settings')
    this.settings.markVisited = storage.settings?.markVisited || defaultSettings.markVisited
    this.settings.markVisitedColor = storage.settings?.markVisitedColor || defaultSettings.markVisitedColor
    this.updateUI()
  }

  private setupEventListeners(): void {
    const form = document.getElementById('settings-form') as HTMLFormElement
    const resetButton = document.getElementById('reset-settings')

    if (form) {
      form.addEventListener('change', () => {
        this.updateSettings({
          markVisited: form.markVisited.checked,
          markVisitedColor: form.markVisitedColor.value,
        })
      })
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetToDefaults()
      })
    }
  }

  public async updateSettings(updates: Partial<FeatureSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...updates,
    }
    await this.saveSettings()

    notifyContentScripts({
      type: 'settingsChanged',
      settings: this.settings,
    })

    this.updateUI()
  }

  private async resetToDefaults(): Promise<void> {
    await this.updateSettings(defaultSettings)
  }

  private async saveSettings(): Promise<void> {
    await chrome.storage.local.set({ settings: this.settings })
  }

  private updateUI(): void {
    const form = document.getElementById('settings-form') as HTMLFormElement
    if (form) {
      form.markVisited.checked = this.settings.markVisited || false
      form.markVisitedColor.value = this.settings.markVisitedColor || '#806D9DFF'
    }
  }
}
