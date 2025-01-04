chrome.action.onClicked.addListener(async () => {
  void chrome.runtime.openOptionsPage()
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html'),
    })
  }
})

if (process.env.NODE_ENV === 'development') {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TEST_INSTALL') {
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html'),
      })
    }
  })
}
