import { CreateHeader } from "./header.js";
import { CreateAndAppendTabsAsList } from "./tab_utils.js";
import { filterBasedOnSearchValue } from "./searchbar.js";
import { getParentTabMap } from "./utils.js";

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


const AddTreeInfo = async (tabs) => {
  const tabIndexMap = {};
  tabs.forEach((tab,i) => tabIndexMap[tab.id] = i);

  tabs.forEach((tab) => {
    const parentId = tab.openerTabId;
    if(parentId && tabIndexMap[tab.openerTabId]) {
      const parentIndex = tabIndexMap[parentId];
      if(!tabs[parentIndex].children) {
        tabs[parentIndex].children = [tab.id];
      } else {
        tabs[parentIndex].children.push(tab.id);
      }
    }
  });
  return tabs;
}

const sortTabsAndAddMetadata = async (tabs, sortBy) => {
  const tabsMetadata = await retrievedTabsMetadata();
  let parentTabMap = await getParentTabMap();
  console.log(parentTabMap);
  const tabIndexMap = {};
  tabs.forEach((tab,i) => tabIndexMap[tab.id] = i);

  let sortedTabs = tabs.map(tab => {
    let site = (new URL(tab.url));
    site = site.hostname.replace("www.", "");
    let openerTabId = parentTabMap.parentTabMap[tab.id] || undefined;
    // Remove opener tab id if opener tab does not exist anymore.
    if(openerTabId && !tabIndexMap[openerTabId]) {
      openerTabId = undefined;
    }
    const updatedAt = tabsMetadata[tab.id] ? tabsMetadata[tab.id].updatedAt : Date.now();
    return { 
      ...tab, 
      site, 
      updatedAt,
      openerTabId,
    }
  });
  sortedTabs.sort((a, b) => CreateTabsListCompare(a, b, sortBy));
  return sortedTabs;
}

const CreateTabsList = async (sortBy, scrollToTop = true) => {
  let tabs = await chrome.tabs.query({});
  let sortedTabs = await sortTabsAndAddMetadata(tabs, sortBy);
  sortedTabs = await AddTreeInfo(sortedTabs);

  let wrapper = document.getElementById("tabs-list");
  let firstTab = null;
  wrapper.replaceChildren();
  CreateAndAppendTabsAsList(sortedTabs,() => CreateTabsList(sortBy, scrollToTop), wrapper);

  if(scrollToTop && document.getElementsByClassName("tab-wrapper")?.length > 0) {
    document.getElementsByClassName("tab-wrapper")[0].childNodes[0].scrollIntoView({block: "center", behavior: "instant"});
  }
  CreateHeader(tabs, (sortBy) => CreateTabsList(sortBy), CloseAllTabsWithIds);
  filterBasedOnSearchValue(document.getElementById("search-bar")?.value || "");
  loadScheme();
  firstTab = wrapper.getElementsByClassName("tab-info-wrapper")[0];
  if (firstTab) {
    firstTab.className += " focused-tab-info-wrapper";
    const theme = (await chrome.storage.local.get("theme")).theme || "classic_mode";
    firstTab.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
  }  
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
