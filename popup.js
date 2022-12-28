import { CreateHeader } from "./header.js";

function retrievedTabsMetadata() {
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.get(null, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(items);
    });
  });
}

const focusOnTabEvent = (e) => {
  focusOnTab(e.currentTarget.tabId);
}

const focusOnTab = (id) => {
  chrome.tabs.update(id, { active: true }, async () => {
      let tab = await chrome.tabs.get(id);
      if(tab.windowId) {
        chrome.windows.update(
          tab.windowId, { focused: true }, () => {});
      }
  });
}

const focusOnTabKeyPress = (e) => {
  const id = e.currentTarget.tabId;
  const sortBy = e.currentTarget.sortBy;

  if(!e.code) return;
  if(e.code === "Enter") focusOnTab(id);
  if(e.code === "KeyX") onCloseTab(id, () => CreateTabsList(sortBy));
}

const tabOnKeyDown = (e) => {
  const tabIndex = e.currentTarget.tabIndex;
  const tabs = e.currentTarget.tabs;
  let found = false;

  if (!e.code) return;
  if (e.code === "ArrowDown") {
    for(let i = tabIndex + 1; i < tabs.length; i++) {
      let nextTabWrapper = document.getElementById("tab_wrapper_" + tabs[i].id);
      let nextTitle = document.getElementById("tab_info_wrapper_" + tabs[i].id);

      let isVisible = false;
      if(nextTabWrapper) {
        isVisible = !nextTabWrapper.style.cssText.includes("display: none");
      }
      if(isVisible) {
        nextTitle.focus();
        found = true;
        break;
      }
    }
    if(!found) {
      document.getElementById("search-bar").focus();
    }
  }
  if (e.code === "ArrowUp") {
    for(let i = tabIndex - 1; i >= 0; i--) {
      let nextTabWrapper = document.getElementById("tab_wrapper_" + tabs[i].id);
      let nextTitle = document.getElementById("tab_info_wrapper_" + tabs[i].id);

      let isVisible = false;
      if(nextTabWrapper) {
        isVisible = !nextTabWrapper.style.cssText.includes("display: none");
      }
      if(isVisible) {
        nextTitle.focus();
        found = true;
        break;
      }
    }
    if(!found) {
      document.getElementById("search-bar").focus();
    }
  }
}

const onCloseTabEvent = (e) => {
  onCloseTab(e.currentTarget.tabId, e.currentTarget.callback);
}

const onCloseTab = (id, callback) => {
  chrome.tabs.remove(id, callback);
}

const CloseAllTabsFromId = (e) => {
  const id = e.currentTarget.tabId;
  const tabs = e.currentTarget.sortedTabs;
  const callback = e.currentTarget.callback;

  let found = false;
  let ids = []
  for(let i = 0; i < tabs.length; i++) {
    if(tabs[i].id == id) {
      found = true;
    } else if(found) {
      ids.push(tabs[i].id);
    }
  }
  chrome.tabs.remove(ids, callback);
}

const CloseAllTabsWithIds = (ids, sortBy) => {
  chrome.tabs.remove(ids, () => CreateTabsList(sortBy));
}

const CreateTabsListCompare = (a, b, type) => {
  if (type == "ACTIVE_ASC") {
    if(a.upatedAt == -1 && b.updatedAt == -1) {
      return 1;
    } else if (a.upatedAt == -1) return -1;
    else if (b.upatedAt == -1) return 1;
    return b.updatedAt - a.updatedAt;
  }
  if (type == "ACTIVE_DESC") {
    if(a.upatedAt == -1 && b.updatedAt == -1) {
      return 1;
    } else if (a.upatedAt == -1) return -1;
    else if (b.upatedAt == -1) return 1;
    return a.updatedAt - b.updatedAt;
  }
  if (type == "TITLE_ASC") {
    return b.title.localeCompare(a.title);
  }
  if (type == "TITLE_DESC") {
    return a.title.localeCompare(b.title);
  }
  if (type == "SITE_ASC") {
    return b.site.localeCompare(a.site);
  }
  if (type == "SITE_DESC") {
    return a.site.localeCompare(b.site);
  }
}

const CreateTabsList = async (sortBy) => {
  const TAB_INDEX_OFFSET = 100;
  let currentTabIndexCounter = 0;

  const tabsMetadata = await retrievedTabsMetadata();
  let tabs = await chrome.tabs.query({});
  CreateHeader(tabs, (sortBy) => CreateTabsList(sortBy), CloseAllTabsWithIds);

  const sortedTabs = tabs.map(tab => {
    let site = (new URL(tab.url));
    site = site.hostname.replace("www.", "");
    return { ...tab, site, updatedAt: tabsMetadata[tab.id] ? tabsMetadata[tab.id].updatedAt : -1 }
  });

  sortedTabs.sort((a, b) => CreateTabsListCompare(a, b, sortBy));
  let wrapper = document.getElementById("tabs-list");
  wrapper.replaceChildren();
  sortedTabs.forEach((tab, index) => {
    const tabWrapper = document.createElement('div');
    tabWrapper.className = "tab-wrapper";
    tabWrapper.setAttribute("id", "tab_wrapper_" + tab.id);
    tabWrapper.style.cssText = "display: flex; align-items:center; justify-content: space-around;";

    const tabInfoWrapper = document.createElement('div');
    tabInfoWrapper.className = "tab-info-wrapper";
    tabInfoWrapper.setAttribute("id", "tab_info_wrapper_" + tab.id);
    tabInfoWrapper.setAttribute("tabindex", TAB_INDEX_OFFSET + currentTabIndexCounter++);
    tabInfoWrapper.addEventListener('click', focusOnTabEvent);
    tabInfoWrapper.tabId = tab.id;
    tabInfoWrapper.sortBy = sortBy;
    tabInfoWrapper.addEventListener('keypress', focusOnTabKeyPress);
    tabInfoWrapper.addEventListener("keydown", tabOnKeyDown);
    tabInfoWrapper.tabs = sortedTabs;
    tabInfoWrapper.tabIndex = index;

    const siteWrapper = document.createElement('div');
    siteWrapper.style.cssText = 'display:flex; width: 5%';
    const site = document.createElement('a');
    site.className = "site-link";
    site.addEventListener('click', focusOnTabEvent);
    site.tabId = tab.id;

    if (tab.favIconUrl) {
      const favIcon = document.createElement('img');
      favIcon.src = tab.favIconUrl;
      favIcon.style.cssText = 'width: 20px;height: 20px;margin-right: 5px;';
      siteWrapper.appendChild(favIcon);
      siteWrapper.appendChild(site);
    } 

    const titleWrapper = document.createElement('div');
    titleWrapper.style.cssText = 'display:flex; width: 75%';
    const title = document.createElement('a');
    title.setAttribute("id", "tab_" + tab.id);
    title.setAttribute("url", tab.url);
    title.style.cssText = 
      'font-size: 12px;font-weight:500;color:#757b86;font-weight: 700;overflow:hidden;white-space:nowrap;text-overflow: ellipsis;cursor:pointer';
    title.textContent = tab.title;

    titleWrapper.appendChild(title);

    const updatedAtElement = document.createElement('span');
    updatedAtElement.style.cssText = 'font-size: 12px;font-weight:500;color:#757b86;font-weight: 700;';
    let updatedAgoMilisecondsAgo = Date.now() - tab.updatedAt;
    const updatedAgoSeconds = parseInt(updatedAgoMilisecondsAgo / 1000);
    const updatedAgoMinutes = parseInt(updatedAgoSeconds / 60);
    const updatedAgoHours = parseInt(updatedAgoMinutes / 60);
    const updatedAgoDays = parseInt(updatedAgoHours / 24);

    let updateAgo;
    if(tab.updatedAt == -1) updateAgo = "--";
    else if (updatedAgoDays > 0) updateAgo = updatedAgoDays + "d ago";
    else if (updatedAgoHours > 0) updateAgo = updatedAgoHours + "h ago";
    else if (updatedAgoMinutes > 0) updateAgo = updatedAgoMinutes + "m ago";
    else updateAgo = "1m ago"

    updatedAtElement.textContent = updateAgo;
    const updatedAtElementWrapper = document.createElement('div');
    updatedAtElementWrapper.style.cssText = 'display:flex; width: 20%;justify-content: end;';
    updatedAtElementWrapper.appendChild(updatedAtElement);

    tabInfoWrapper.appendChild(siteWrapper);
    tabInfoWrapper.appendChild(titleWrapper);
    tabInfoWrapper.appendChild(updatedAtElementWrapper);

    const closeTab = document.createElement('div');
    closeTab.className = "close-button"
    const closeTabIcon = document.createElement('span');
    closeTabIcon.textContent = "close";
    closeTabIcon.className = "material-icons close-tab-icon"
    closeTab.appendChild(closeTabIcon);
    closeTab.addEventListener('click', onCloseTabEvent);
    closeTab.tabId = tab.id;
    closeTab.callback = () => CreateTabsList(sortBy);
     
    const closeAllDown = document.createElement('div');
    closeAllDown.className = "close-button close-all-button left"
    const closeAllDownIcon = document.createElement('span');
    closeAllDownIcon.textContent = "arrow_downward";
    closeAllDownIcon.className = "material-icons close-all-icon"
    const closeAllCloseIcon = document.createElement('span');
    closeAllCloseIcon.textContent = "close";
    closeAllCloseIcon.className = "material-icons close-tab-icon";
    const closeAllTooltip = document.createElement('div');
    closeAllTooltip.className = "tooltip"
    closeAllTooltip.textContent = "Close all to the bottom";
    closeAllDown.appendChild(closeAllCloseIcon);
    closeAllDown.appendChild(closeAllDownIcon);
    closeAllDown.appendChild(closeAllTooltip);
    closeAllDown.addEventListener('click', CloseAllTabsFromId);
    closeAllDown.tabId = tab.id;
    closeAllDown.sortedTabs = sortedTabs;
    closeAllDown.callback = () => CreateTabsList(sortBy);

    tabWrapper.appendChild(tabInfoWrapper);
    tabWrapper.appendChild(closeTab);
    tabWrapper.appendChild(closeAllDown);
    
    wrapper.appendChild(tabWrapper);    
  }) 
}

const populateWithTabs = () => {
  CreateTabsList("ACTIVE_ASC");
}

populateWithTabs();
document.getElementById("search-bar").focus();

