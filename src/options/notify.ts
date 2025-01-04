import { NotifyMessage } from '../interfaces/interfaces'

export const notifyContentScripts = async (data: NotifyMessage) => {
  try {
    const tabs = await chrome.tabs.query({ url: ['https://github.com/*'] })

    const messagePromises = tabs.map((tab) => {
      if (tab.id) {
        return chrome.tabs.sendMessage(tab.id, data).catch((err) => {
          console.log(`Could not send to tab ${tab.id}:`, err)
        })
      }
    })

    await Promise.all(messagePromises)
  } catch (error) {
    console.error('Error notifying content scripts:', error)
  }
}
