import { CreateHeader } from "./header.js";
import { focusOnTab } from "./tab_utils.js";
import { filterBasedOnSearchValue } from "./searchbar.js";

export const COLOR_SCHEMES = { 
  dark_mode: { 
    primaryColor: "#00B4CC",
    backgroundColor: "#282828", 
    titleColor: "#ffffff",
    iconColor: "#ffffff",
    tabHighlightColor: "#3E54AC",
    urlTitleColor: "#ffffff",
    tabWrapperColor: "#404040",
    updateAgoTextColor: "#ffffff",
    focusTabColor: "#b3b3b3",
    themeSectionColor: "#ffffff",
  },
  classic_mode: {
    backgroundColor: "#eff",
    primaryColor: "#00B4CC",
    tabWrapperColor: "#ffffff",
    focusTabColor: "rgba(0, 180, 204, 0.35)",
    themeSectionColor: "#333333",
    titleColor: "#282828", 
    updateAgoTextColor: "#757b86",
  }
}

async function loadScheme() {
  const theme = (await chrome.storage.local.get("theme")).theme || "classic_mode";
  const backgroundColor = COLOR_SCHEMES[theme].backgroundColor;
  const titleColor = COLOR_SCHEMES[theme]?.titleColor || '';
  const tabWrapperColor = COLOR_SCHEMES[theme]?.tabWrapperColor || '';
  const urlTitleColor = COLOR_SCHEMES[theme]?.urlTitleColor || '';
  const updateAgoTextColor = COLOR_SCHEMES[theme]?.updateAgoTextColor || '';
  const primaryColor = COLOR_SCHEMES[theme].primaryColor;

  document.getElementById("suggestions-text").style.color = COLOR_SCHEMES[theme].themeSectionColor;
  document.getElementById("suggestions_theme_icon").style.color = COLOR_SCHEMES[theme].themeSectionColor;  
  document.getElementById("donate-text").style.color = COLOR_SCHEMES[theme].themeSectionColor;
  document.getElementById("donate_theme_icon").style.color = COLOR_SCHEMES[theme].themeSectionColor;  
  document.getElementById("toggle-theme-text").style.color = COLOR_SCHEMES[theme].themeSectionColor;
  document.getElementById("toggle_theme_icon").style.color = COLOR_SCHEMES[theme].themeSectionColor;
  document.getElementById("search-bar").style.border = "3px solid " + primaryColor;
  document.getElementById("search-bar-button").style.border = "1px solid " + primaryColor;  
  document.getElementById("search-bar-button").style.background = primaryColor;  
  document.getElementById("body").style.backgroundColor = backgroundColor;  
  document.getElementById("top-header").style.backgroundColor = backgroundColor;

  const toogleThemeIcon = document.getElementById("toggle_theme_icon");
  toogleThemeIcon.textContent = theme === "dark_mode" ? "toggle_on" : "toggle_off"; 

  document.getElementById("title").style.color = titleColor;  
  Array.from(document.getElementsByClassName("sortIcon")).forEach((icon) => {
    icon.style.color = titleColor;
  });
  Array.from(document.getElementsByClassName("header-button")).forEach((icon) => {
    icon.style.color = titleColor;
  });
  Array.from(document.getElementsByClassName("close-tab-icon")).forEach((icon) => {
    icon.style.color = titleColor;
  });
  Array.from(document.getElementsByClassName("tab-info-wrapper")).forEach((icon) => {
    icon.style.backgroundColor = tabWrapperColor;
  });
  Array.from(document.getElementsByClassName("url-title-text")).forEach((icon) => {
    icon.style.color = urlTitleColor;
  });
  Array.from(document.getElementsByClassName("updated-ago-text")).forEach((icon) => {
    icon.style.color = updateAgoTextColor;
  });
  Array.from(document.getElementsByClassName("more-vert-button")).forEach((icon) => {
    icon.style.color = updateAgoTextColor;
  });  
}

function retrievedTabsMetadata() {
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.local.get(null, (items) => {
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

const onCloseTabEvent = (e) => {
  onCloseTab(e.currentTarget.tabId, e.currentTarget.callback);
}

const onCloseTab = (id, callback) => {
  chrome.tabs.remove(id, callback);
}

const CloseAllTabsFromId = (e) => {
  const id = e.currentTarget.tabId;
  const tabs = e.currentTarget.sortedTabs;
  // Fix sortBy issue.
  const sortBy = e.currentTarget.sortBy;

  let found = false;
  let ids = []
  for(let i = 0; i < tabs.length; i++) {
    if(tabs[i].id == id) {
      found = true;
    } else if(found) {
      ids.push(tabs[i].id);
    }
  }
  CloseAllTabsWithIds(ids, sortBy, false);
}

const CloseAllTabsWithIds = (ids, sortBy, scrollToTop = true) => {
  chrome.tabs.remove(ids, () => {
    chrome.storage.local.remove(ids.map((id) => Number.isInteger(id) ? id.toString() : id), () => CreateTabsList(sortBy, scrollToTop));
  });
}

const CreateTabsListCompare = (a, b, type) => {
  if (type == "ACTIVE_ASC") {
    return b.updatedAt - a.updatedAt;
  }
  if (type == "ACTIVE_DESC") {
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

const showTabMoreVertMenu = async (e) => {
  const id = e.currentTarget.tabId;
  const showTabMoreVertMenu = document.getElementById("tab-more-vert-menu_" + id);
  const showTabMoreVertMenuIcon = document.getElementById("show-tab-more-vert-menu-icon_" + id);

  if (!showTabMoreVertMenu.style.cssText.includes("display: block;")) {
    showTabMoreVertMenu.style.cssText = showTabMoreVertMenu.style.cssText + "display: block;"
    showTabMoreVertMenuIcon.style.color = "black";
  } else {
    showTabMoreVertMenu.style.cssText = showTabMoreVertMenu.style.cssText.replace("display: block;", "");
    const theme = (await chrome.storage.local.get("theme")).theme || "classic_mode";
    showTabMoreVertMenuIcon.style.color = COLOR_SCHEMES[theme].updateAgoTextColor;
  }
}

const CreateTabMoreVertMenu = (tabId, sortedTabs) => {
  const tabMoreVertMenuIcon = document.createElement('div');
  tabMoreVertMenuIcon.className = "more-vert-button more-vert-all-button left"
  tabMoreVertMenuIcon.setAttribute("id", "show-tab-more-vert-menu-icon_" + tabId);
  const closeAllCloseIcon = document.createElement('span');
  closeAllCloseIcon.textContent = "more_vert";
  closeAllCloseIcon.className = "material-icons more-vert";
  tabMoreVertMenuIcon.appendChild(closeAllCloseIcon);  
  tabMoreVertMenuIcon.addEventListener('click', showTabMoreVertMenu);
  tabMoreVertMenuIcon.tabId = tabId;

  const tabMoreVertMenu = document.createElement('div');
  tabMoreVertMenu.className = "popup-menu";
  tabMoreVertMenu.style.cssText = "top: 25px; right:-15px; width: 160px;"
  tabMoreVertMenu.setAttribute("id", "tab-more-vert-menu_" + tabId);

  const closeAllToTheBottomItem = document.createElement('div');
  closeAllToTheBottomItem.className = "popup-menu-item";
  closeAllToTheBottomItem.tabId = tabId;
  closeAllToTheBottomItem.sortedTabs = sortedTabs;
  closeAllToTheBottomItem.callback = () => CreateTabsList(sortBy, false);
  closeAllToTheBottomItem.addEventListener('click', CloseAllTabsFromId);

  const closeAllToTheBottomItemText = document.createElement('span');
  closeAllToTheBottomItemText.setAttribute("id", "tab-more-vert-text");
  closeAllToTheBottomItemText.className = "popup-menu-item-text";
  closeAllToTheBottomItemText.textContent = "Close all to the bottom";
  closeAllToTheBottomItem.appendChild(closeAllToTheBottomItemText);
  tabMoreVertMenu.appendChild(closeAllToTheBottomItem);

  tabMoreVertMenuIcon.appendChild(tabMoreVertMenu);

  return tabMoreVertMenuIcon;
}

const CreateTabsList = async (sortBy, scrollToTop = true) => {
  const tabsMetadata = await retrievedTabsMetadata();
  let tabs = await chrome.tabs.query({});

  let sortedTabs = tabs.map(tab => {
    let site = (new URL(tab.url));
    site = site.hostname.replace("www.", "");
    return { ...tab, site, updatedAt: tabsMetadata[tab.id] ? tabsMetadata[tab.id].updatedAt : Date.now() }
  });

  sortedTabs.sort((a, b) => CreateTabsListCompare(a, b, sortBy));
  if(sortBy === "ACTIVE_ASC" && sortedTabs.length > 0) {
    sortedTabs.push(sortedTabs[0]);
    sortedTabs.shift();
  }

  let wrapper = document.getElementById("tabs-list");
  wrapper.replaceChildren();
  sortedTabs.forEach((tab, index) => {
    const tabWrapper = document.createElement('div');
    tabWrapper.className = "tab-wrapper";
    tabWrapper.setAttribute("id", "tab_wrapper_" + tab.id);
    tabWrapper.style.cssText = "display: flex; align-items:center; justify-content: space-around;";

    const tabInfoWrapper = document.createElement('div');
    tabInfoWrapper.className = "tab-info-wrapper";
    if (index == 0) {
      tabInfoWrapper.className += " focused-tab-info-wrapper";
    }
    tabInfoWrapper.setAttribute("id", "tab_info_wrapper_" + tab.id);
    tabInfoWrapper.setAttribute("tabindex", -1);

    const siteWrapper = document.createElement('div');
    siteWrapper.style.cssText = 'display:flex; width: 10%';
    const site = document.createElement('a');
    site.className = "site-link";
    siteWrapper.addEventListener('click', focusOnTabEvent);
    siteWrapper.tabId = tab.id;

    if (tab.favIconUrl) {
      const favIcon = document.createElement('img');
      favIcon.src = tab.favIconUrl;
      favIcon.style.cssText = 'width: 20px;height: 20px;margin-right: 5px;';
      siteWrapper.appendChild(favIcon);
      siteWrapper.appendChild(site);
    } 

    const titleWrapper = document.createElement('div');
    titleWrapper.style.cssText = 'display:flex; width: 70%';
    const title = document.createElement('a');
    title.setAttribute("id", "tab_" + tab.id);
    title.setAttribute("url", tab.url);
    title.className += "url-title-text";      
    title.textContent = tab.title;
    titleWrapper.addEventListener('click', focusOnTabEvent);
    titleWrapper.tabId = tab.id;
    titleWrapper.appendChild(title);

    const updatedAtElement = document.createElement('span');
    updatedAtElement.className += "updated-ago-text";      
    let updatedAgoMilisecondsAgo = Date.now() - tab.updatedAt;
    const updatedAgoSeconds = parseInt(updatedAgoMilisecondsAgo / 1000);
    const updatedAgoMinutes = parseInt(updatedAgoSeconds / 60);
    const updatedAgoHours = parseInt(updatedAgoMinutes / 60);
    const updatedAgoDays = parseInt(updatedAgoHours / 24);

    let updateAgo;
    if (updatedAgoDays > 0) updateAgo = updatedAgoDays + "d ago";
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
    tabInfoWrapper.appendChild(CreateTabMoreVertMenu(tab.id, sortedTabs));

    const closeTab = document.createElement('div');
    closeTab.className = "close-button"
    const closeTabIcon = document.createElement('span');
    closeTabIcon.textContent = "close";
    closeTabIcon.className = "material-icons close-tab-icon"
    closeTab.appendChild(closeTabIcon);
    closeTab.addEventListener('click', onCloseTabEvent);
    closeTab.tabId = tab.id;
    closeTab.callback = () => CreateTabsList(sortBy, false);

    tabWrapper.appendChild(tabInfoWrapper);
    tabWrapper.appendChild(closeTab);
    
    wrapper.appendChild(tabWrapper);    
  });
  if(scrollToTop && document.getElementsByClassName("tab-wrapper")?.length > 0) {
    document.getElementsByClassName("tab-wrapper")[0].childNodes[0].scrollIntoView({block: "center", behavior: "instant"});
  }
  CreateHeader(tabs, (sortBy) => CreateTabsList(sortBy), CloseAllTabsWithIds);
  filterBasedOnSearchValue(document.getElementById("search-bar")?.value || "");
  loadScheme();
}

const populateWithTabs = () => {
  CreateTabsList("ACTIVE_ASC");
}

const onBodyClicked = (e) => {
  document.getElementById("search-bar").focus();
}

const addBodyEvents = () => {
  const body = document.getElementById("body");
  body.addEventListener('click', onBodyClicked);
}

document.getElementById("search-bar").focus();

populateWithTabs();
addBodyEvents();
loadScheme();

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if(key === "theme") {
      loadScheme();
    }
  }
});

