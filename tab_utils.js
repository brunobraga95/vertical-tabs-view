import { getTabById} from "./utils.js";

export const focusOnTab = (id) => {
    chrome.tabs.update(id, { active: true }, async () => {
        let tab = await chrome.tabs.get(id);
        if(tab.windowId) {
          chrome.windows.update(
            tab.windowId, { focused: true }, () => {});
        }
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

const showTabMoreVertMenu = async (e) => {
  e.stopPropagation();
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

const CreateTab = (tab, tabs, refetchTabs, level = 0) => {
    const tabWrapper = document.createElement('div');
    tabWrapper.className = "tab-wrapper";
    tabWrapper.setAttribute("id", "tab_wrapper_" + tab.id);
    tabWrapper.style.cssText = "display: flex; align-items:center; justify-content: space-around; " + "margin-left: " + level * 45 + "px;";
    
    const tabInfoWrapper = document.createElement('div');
    tabInfoWrapper.className = "tab-info-wrapper";
    tabInfoWrapper.setAttribute("id", "tab_info_wrapper_" + tab.id);
    tabInfoWrapper.setAttribute("tabindex", -1);
    tabInfoWrapper.addEventListener('click', focusOnTabEvent);
    tabInfoWrapper.tabId = tab.id;
  
    const siteWrapper = document.createElement('div');
    siteWrapper.style.cssText = 'display:flex; width: 10%';
    const site = document.createElement('a');
    site.className = "site-link";
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
    tabInfoWrapper.appendChild(CreateTabMoreVertMenu(tab.id, tabs));
  
    const closeTab = document.createElement('div');
    closeTab.className = "close-button"
    const closeTabIcon = document.createElement('span');
    closeTabIcon.textContent = "close";
    closeTabIcon.className = "material-icons close-tab-icon"
    closeTab.appendChild(closeTabIcon);
    closeTab.addEventListener('click', onCloseTabEvent);
    closeTab.tabId = tab.id;
    closeTab.callback = () => refetchTabs();
  
    tabWrapper.appendChild(tabInfoWrapper);
    tabWrapper.appendChild(closeTab);
    
    return tabWrapper; 
  }

const AddHorizontalDotsForTreeLayout = (tabId, level) => {
  let tab = getTabById(tabId);

  const horizontalDotsWrapper = document.createElement('div');
  horizontalDotsWrapper.className = "horizontal-dots-wrapper";
  horizontalDotsWrapper.innerText = ".....";

  tab.appendChild(horizontalDotsWrapper);
}

const AddVerticalDotsForTreeLayout = (parentTab) => {
  let lowestChildTab = null;
  parentTab.children.forEach(childId => {
    let childTab = getTabById(childId);
    if(!lowestChildTab)
      lowestChildTab = childTab;
    
    if(childTab.getBoundingClientRect().top > lowestChildTab.getBoundingClientRect().top)
    lowestChildTab = childTab;
  });
  
  let tabHtml = getTabById(parentTab.id);

  const verticalDotsWrapper = document.createElement('div');
  verticalDotsWrapper.className = "vertical-dots-wrapper";
  const expectedHeight = lowestChildTab.getBoundingClientRect().top - tabHtml.getBoundingClientRect().bottom + (lowestChildTab.getBoundingClientRect().bottom - lowestChildTab.getBoundingClientRect().top)/2 - 1;
  verticalDotsWrapper.style.height = `${expectedHeight}px`
  tabHtml.appendChild(verticalDotsWrapper);
  console.log(verticalDotsWrapper.getBoundingClientRect().bottom, verticalDotsWrapper.getBoundingClientRect().top, expectedHeight);
  for(let i = 0; i < 100; i++) {
    verticalDotsWrapper.textContent += ".";
  }

}

const RenderTabsAsTree = (tabs, tab, renderedTabs, tabIdToIndex, level, refetchTabs, wrapper) => {
  if(tab.openerTabId && !renderedTabs[tab.openerTabId]) {
    RenderTabsAsTree(tabs, tabs[tabIdToIndex[tab.openerTabId]], renderedTabs, tabIdToIndex, 0, refetchTabs, wrapper);
  }
  if(!renderedTabs[tab.id]) {
    const tabWrapper = CreateTab(tab, tabs, refetchTabs, level);
    wrapper.appendChild(tabWrapper); 
    renderedTabs[tab.id] = true;
    if(tab.children) {
      tab.children.forEach(childId => {
        const newLevel = level + 1;
        RenderTabsAsTree(tabs, tabs[tabIdToIndex[childId]], renderedTabs, tabIdToIndex, newLevel, refetchTabs, wrapper);
        AddHorizontalDotsForTreeLayout(childId);
      });
      AddVerticalDotsForTreeLayout(tab);
    }
  }
}


export const CreateAndAppendTabsAsList = (tabs, refetchTabs, wrapper) => {
  let tabIdToIndex = {};
  tabs.forEach((tab, i) => tabIdToIndex[tab.id] = i);
  let renderedTabs = {}
  console.log(tabs);
  tabs.forEach(tab => RenderTabsAsTree(tabs, tab, renderedTabs, tabIdToIndex, 0, refetchTabs, wrapper));

  // RenderTabsAsTree(tabs, {}, childrenTree, tabIdToIndex, wrapper);
  /*
  tabs.forEach(async (tab) => {
    const tabWrapper = CreateTab(tab, tabs);
    wrapper.appendChild(tabWrapper);    
  });
  */
}