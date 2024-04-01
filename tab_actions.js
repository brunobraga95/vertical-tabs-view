import Analytics from "./google-analytics.js";

export const getRenderedRows = () =>
  document.getElementsByClassName("tab-wrapper");

export const getCurrentTheme = () =>
  chrome.storage.local.get("theme").theme || "classic_mode";

export const removeFocusClass = (tab) =>
  tab.classList.remove("focused-tab-info-wrapper");

export const containsFocusClass = (tab) =>
  tab.classList.contains("focused-tab-info-wrapper");

export const removeFocusStyleFromTabInfo = (tab) =>
  tab.classList.remove("focused-tab-info-wrapper");

export const getTabById = (id) =>
  document.getElementById("tab_info_wrapper_" + id);

export const CloseAllTabsWithIds = async (ids) => {
  // Only remove tabs that exist.
  const tabs = await chrome.tabs.query({});
  chrome.tabs.remove(
    ids.filter((id) =>
      tabs.map((tab) => tab.id).find((existingsId) => existingsId === id),
    ),
    () => {
      chrome.storage.local.remove(
        ids.map((id) => (Number.isInteger(id) ? id.toString() : id)),
        () => {
          chrome.storage.local.get("lastCreateTabsListContext", (context) => {
            chrome.storage.local.set(
              {
                lastCreateTabsListContext: {
                  ...context?.lastCreateTabsListContext,
                  scrollToTop: false,
                },
              },
              function () {},
            );
          });
        },
      );
    },
  );
};

export const focusOnTab = (id) => {
  chrome.tabs.update(id, { active: true }, async () => {
    let tab = await chrome.tabs.get(id);
    if (tab.windowId) {
      chrome.windows.update(tab.windowId, { focused: true }, () => {});
    }
  });
};

export const focusOnTabEvent = (e) => {
  Analytics.fireEvent("tab_clicked");
  focusOnTab(e.currentTarget.tabId);
};

export const onCloseTabEvent = (e) => {
  Analytics.fireEvent("close_tab_clicked");
  onCloseTab(e.currentTarget.tabId);
};

const onCloseTab = (id) => {
  chrome.tabs.remove(id, () => {});
};
