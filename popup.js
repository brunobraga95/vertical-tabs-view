import { CreateHeader } from "./header.js";
import { GetFirstTabInfoWrapperElement, CreateTabElement, GetCurrenTabsHtml, GetTabFromID} from "./tab_utils.js";
import { CloseAllTabsWithIds} from "./tab_actions.js";
import { FilterBasedOnSearchValue } from "./searchbar.js";
import { COLOR_SCHEMES } from "./colors.js";

async function LoadScheme() {
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
  Array.from(document.getElementsByClassName("header-button")).forEach((header) => {
    header.style.color = titleColor;
  });
  Array.from(document.getElementsByClassName("close-tab-icon")).forEach((closeTabIcon) => {
    closeTabIcon.style.color = titleColor;
  });
  Array.from(document.getElementsByClassName("tab-info-wrapper")).forEach((tabInfoWrapper) => {
    tabInfoWrapper.style.backgroundColor = tabWrapperColor;
  });
  Array.from(document.getElementsByClassName("focused-tab-info-wrapper")).forEach((focusedTab, i) => {
    if(i === 0)
      focusedTab.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
  });
  Array.from(document.getElementsByClassName("url-title-text")).forEach((urlTitle) => {
    urlTitle.style.color = urlTitleColor;
  });
  Array.from(document.getElementsByClassName("updated-ago-text")).forEach((updatedAgoText) => {
    updatedAgoText.style.color = updateAgoTextColor;
  });
  Array.from(document.getElementsByClassName("more-vert-button")).forEach((moreVertButton) => {
    moreVertButton.style.color = updateAgoTextColor;
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

const FocusOnFirstTab = async () => {
  let firstTab = GetFirstTabInfoWrapperElement();
  if (firstTab) {
    firstTab.className += " focused-tab-info-wrapper";
    const theme = (await chrome.storage.local.get("theme")).theme || "classic_mode";
    firstTab.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
  }
  document.getElementById("search-bar").focus();
}

const CreateTabsList = async (sortBy, scrollToTop = true) => {
  chrome.storage.local.set({ lastCreateTabsListContext: { sortBy, scrollToTop } }, function() {});
  const tabsMetadata = await retrievedTabsMetadata();
  let tabs = await chrome.tabs.query({});

  let sortedTabs = tabs.map(tab => {
    let site = tab?.url && tab.url.length > 0 ? (new URL(tab.url)) : "";
    site = site !== "" ? site.hostname.replace("www.", "") : "";
    return { ...tab, site, updatedAt: tabsMetadata[tab.id] ? tabsMetadata[tab.id].updatedAt : Date.now() }
  });

  sortedTabs.sort((a, b) => CreateTabsListCompare(a, b, sortBy));
  let wrapper = document.getElementById("tabs-list");
  wrapper.replaceChildren();

  sortedTabs.forEach(async (tab) => {
    const tabElement = CreateTabElement(tab, sortedTabs.map(tab => tab.id));
    wrapper.appendChild(tabElement);    
  });

  if(scrollToTop && document.getElementsByClassName("tab-wrapper")?.length > 0) {
    document.getElementsByClassName("tab-wrapper")[0].childNodes[0].scrollIntoView({block: "center", behavior: "instant"});
  }
  CreateHeader(tabs, (sortBy) => CreateTabsList(sortBy), CloseAllTabsWithIds);
  FilterBasedOnSearchValue(document.getElementById("search-bar")?.value || "");
  LoadScheme();
  FocusOnFirstTab();
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
LoadScheme();

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  const fallbackLoadEverything = () => {
    // If we cant be smart and update only what we want, render eveything.
    chrome.storage.local.get("lastCreateTabsListContext", (context) => {
      CreateTabsList(context?.lastCreateTabsListContext?.sortBy || "ACTIVE_ASC", context?.lastCreateTabsListContext?.scrollToTop);
    });
  }

  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if(key === "theme") {
      LoadScheme();
      return;
    }
    if(!isNaN(key)) {
      // Changed updated at, if tab is not active fallback. this covers the case where a tab that is not
      // focused finished loading on the background.
      const existingTabUpdated = oldValue?.updatedAt && newValue?.updatedAt && oldValue?.updatedAt != newValue.updatedAt;
      const newTab = !oldValue && newValue?.updatedAt;
      if(existingTabUpdated || newTab) {
        const tabHtml = GetTabFromID(key);
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find(tab => tab.id === parseInt(key));
        if (!tab || !tabHtml) {
          fallbackLoadEverything();
          continue;
        }
        let newTab = CreateTabElement(tab);
        newTab.style.visibility = "hidden";
        const currentTabsList = GetCurrenTabsHtml();
        if(existingTabUpdated) {
          if(!tab.active) {
            fallbackLoadEverything();
            continue;
          }
          tabHtml.parentNode.removeChild(tabHtml);
          currentTabsList.insertBefore(newTab, currentTabsList.firstChild);
          // load scheme to apply changed
          LoadScheme();
          FocusOnFirstTab();
          // now make it visible.
          newTab.style.visibility = ""; 
        } else {
          currentTabsList.insertBefore(newTab, currentTabsList.firstChild);
          // load scheme to apply changed
          LoadScheme();
          // now make it visible.
          newTab.style.visibility = "";
        }
      } else if(oldValue && oldValue.updatedAt && !newValue) {
        const tabHtml = GetTabFromID(key);
        if (!tabHtml) {
          fallbackLoadEverything();
          continue;
        }
        tabHtml.parentNode.removeChild(tabHtml);
      } else {
        fallbackLoadEverything();
        continue;
      }
      document.getElementById("search-bar").focus();
    }
  }
});
