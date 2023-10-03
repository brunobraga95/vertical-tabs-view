export const CloseAllTabsWithIds = async (ids) => {
    // Only remove tabs that exist.
    const tabs = await chrome.tabs.query({});
    console.log(tabs.map(tab => tab.id));
    console.log(ids);
    console.log(ids.filter(id => tabs.map(tab => tab.id).find(existingsId => existingsId === id)));
    chrome.tabs.remove(ids.filter(id => tabs.map(tab => tab.id).find(existingsId => existingsId === id)), () => {
      chrome.storage.local.remove(ids.map((id) => Number.isInteger(id) ? id.toString() : id), () => {
        chrome.storage.local.get("lastCreateTabsListContext", (context) => {
          chrome.storage.local.set({ lastCreateTabsListContext: { ...context?.lastCreateTabsListContext, scrollToTop: false } }, function() {});
        });
      });
    });
  }

  export const focusOnTab = (id) => {
    chrome.tabs.update(id, { active: true }, async () => {
        let tab = await chrome.tabs.get(id);
        if(tab.windowId) {
          chrome.windows.update(
            tab.windowId, { focused: true }, () => {});
        }
    });
  }

export const focusOnTabEvent = (e) => {
    focusOnTab(e.currentTarget.tabId);
  }
  
export const onCloseTabEvent = (e) => {
    onCloseTab(e.currentTarget.tabId);
  }
  
const onCloseTab = (id) => {
  chrome.tabs.remove(id, () => {});
}