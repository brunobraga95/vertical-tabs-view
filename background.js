chrome.tabs.onCreated.addListener((tab) => {
  if(!tab.id)
    return;
  let entry = {}
  entry[tab.id] = {
    updatedAt: Date.now(),
  }
  chrome.storage.sync.set(entry, function() {});
})

chrome.tabs.onActivated.addListener((tab) => {
  if(!tab.tabId)
    return;
  let entry = {}
  entry[tab.tabId] = {
    updatedAt: Date.now(),
  }
  chrome.storage.sync.set(entry, function() {});
})

chrome.tabs.onRemoved.addListener((tab) => {
  chrome.storage.sync.remove(tab.toString(), function() {});
})

