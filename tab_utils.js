export const focusOnTab = (id) => {
    chrome.tabs.update(id, { active: true }, async () => {
        let tab = await chrome.tabs.get(id);
        if(tab.windowId) {
          chrome.windows.update(
            tab.windowId, { focused: true }, () => {});
        }
    });
  }
