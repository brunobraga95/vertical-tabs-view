let badgeColor = [0, 255, 255, 255];
let tabs = [];

function indexOfTab(tabId) {
  for (let i = 0; i < tabs.length; i++) {
    if (tabId === tabs[i].id) {
      return i;
    }
  }
  return -1;
}

function updateBadgeText() {
  let val = tabs.length;
  chrome.action.setBadgeText({text: val + ""});
}

function initBadgeIcon() {
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  updateBadgeText();
}


function init() {
  // reset the extension state
  tabs = [];

  // init the badge text
  initBadgeIcon();

  // count and record all the open tabs for all the windows
  chrome.windows.getAll({populate: true}, function(windows) {
    for (let i = 0; i < windows.length; i++) {
      let t = windows[i].tabs;

      for (let j = 0; j < t.length; j++) {
        tabs.push(t[j]);
      }
      updateBadgeText();
    }
  });
 
  chrome.tabs.onCreated.addListener((tab) => {
    if(!tab.id)
      return;
    let entry = {}
    tabs.push(tab);
    entry[tab.id] = {
      updatedAt: Date.now(),
    }
    chrome.storage.sync.set(entry, function() {});
    updateBadgeText();
  });
  
  chrome.tabs.onActivated.addListener((tab) => {
    if(!tab.tabId)
      return;
    let entry = {}
    entry[tab.tabId] = {
      updatedAt: Date.now(),
    }
    chrome.storage.sync.set(entry, function() {});
  });

  chrome.tabs.onRemoved.addListener((tab) => {
    let idx = indexOfTab(tab);
    if (idx >= 0) {
      tabs.splice(idx, 1);
      updateBadgeText();
    }
    chrome.storage.sync.remove(tab.toString(), () => {});
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    tabs[indexOfTab(tabId)] = tab;
    updateBadgeText();
  });

  chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
    chrome.tabs.get(addedTabId, (tab) => {
      tabs[indexOfTab(removedTabId)] = tab;
    })
  });
}

init();