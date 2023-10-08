import Analytics from "./google-analytics.js";

let badgeColor = [0, 255, 255, 255];
let tabs = [];

addEventListener("unhandledrejection", async (event) => {
  Analytics.fireErrorEvent(event.reason);
});

// Throw an exception after a timeout to trigger an exception analytics event
setTimeout(throwAnException, 2000);

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

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
  chrome.action.setBadgeText({ text: val + "" });
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
  chrome.windows.getAll({ populate: true }, function (windows) {
    for (let i = 0; i < windows.length; i++) {
      let t = windows[i].tabs;

      for (let j = 0; j < t.length; j++) {
        tabs.push(t[j]);
      }
      updateBadgeText();
    }
  });
  let tabsToRemove = [];
  let tabsToAddMetadata = {};

  chrome.storage.local.get(null, (storedTabs) => {
    const currentTabIds = tabs.map((tab) => tab.id.toString());
    let storedTabKeys = [];
    Object.keys(storedTabs).forEach((storedTabKey) => {
      if (storedTabKey !== "theme" && !currentTabIds.includes(storedTabKey)) {
        tabsToRemove.push(storedTabKey);
      } else if (storedTabKey !== "theme") {
        storedTabKeys.push(storedTabKey);
      }
    });
    for (const id of currentTabIds) {
      if (!storedTabKeys.includes(id) || !storedTabs[id].updatedAt) {
        tabsToAddMetadata[id] = { updatedAt: Date.now() };
      }
    }
    chrome.storage.local.remove(tabsToRemove, () => {});
    chrome.storage.local.set(tabsToAddMetadata, function () {});
  });

  chrome.tabs.onCreated.addListener((tab) => {
    if (!tab.id || tab.status === "loading") return;
    let entry = {};
    tabs.push(tab);
    entry[tab.id] = {
      updatedAt: Date.now(),
    };
    chrome.storage.local.set(entry, function () {});
    updateBadgeText();
  });

  chrome.tabs.onActivated.addListener((tab) => {
    if (!tab.tabId) return;
    let entry = {};
    entry[tab.tabId] = {
      updatedAt: Date.now(),
    };
    chrome.storage.local.set(entry, async function () {});
  });

  chrome.tabs.onRemoved.addListener((tab) => {
    let idx = indexOfTab(tab);
    if (idx >= 0) {
      tabs.splice(idx, 1);
      updateBadgeText();
    }
    chrome.storage.local.remove(tab.toString(), () => {});
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // If one of these info exists is becase they are new updates. We are not interested in them,
    // I want to wait until it becomes complete.
    if (
      changeInfo.status === "loading" ||
      changeInfo.title ||
      changeInfo.title ||
      changeInfo.favIconUrl
    )
      return;
    tabs[indexOfTab(tabId)] = tab;
    updateBadgeText();
    let entry = {};
    entry[tabId] = {
      updatedAt: Date.now(),
    };
    chrome.storage.local.set(entry, async function () {});
  });

  chrome.tabs.onReplaced.addListener(function (addedTabId, removedTabId) {
    chrome.tabs.get(addedTabId, (tab) => {
      tabs[indexOfTab(removedTabId)] = tab;
    });
  });
}

chrome.runtime.setUninstallURL(
  "https://docs.google.com/forms/d/1hxXhGfBmkKo6du690UpvZJ7LqDOz5xE-yMujOrms6RI",
);

init();
