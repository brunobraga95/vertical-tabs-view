import { CreateTabMoreVertMenu } from "./more_vert_utils.js";
import { focusOnTabEvent, onCloseTabEvent } from "./tab_actions.js";

export const GetCurrenTabsHtml = () => document.getElementById("tabs-list");
export const GetTabFromID = (id) =>
  document.getElementById("tab_wrapper_" + id);

  
  const AddHorizontalDotsForTreeLayout = (tabId, level) => {
    let tab = GetTabFromID(tabId);
  
    const horizontalDotsWrapper = document.createElement('div');
    horizontalDotsWrapper.className = "horizontal-dots-wrapper";
    horizontalDotsWrapper.innerText = ".....";
  
    tab.appendChild(horizontalDotsWrapper);
  }
  
  const AddVerticalDotsForTreeLayout = (parentTab) => {
    let lowestChildTab = null;
    parentTab.children.forEach(childId => {
      let childTab = GetTabFromID(childId);
      if(!lowestChildTab)
        lowestChildTab = childTab;
  
      if(childTab.getBoundingClientRect().top > lowestChildTab.getBoundingClientRect().top)
      lowestChildTab = childTab;
    });
  
    let tabHtml = GetTabFromID(parentTab.id);
  
    const verticalDotsWrapper = document.createElement('div');
    verticalDotsWrapper.className = "vertical-dots-wrapper";
    const expectedHeight = lowestChildTab.getBoundingClientRect().top - tabHtml.getBoundingClientRect().bottom + (lowestChildTab.getBoundingClientRect().bottom - lowestChildTab.getBoundingClientRect().top)/2 - 1;
    verticalDotsWrapper.style.height = `${expectedHeight}px`
    tabHtml.appendChild(verticalDotsWrapper);
    console.log(verticalDotsWrapper.getBoundingClientRect().bottom, verticalDotsWrapper.getBoundingClientRect().top, expectedHeight);
    for(let i = 0; i < 100; i++) {
      console.log("really adding");
      verticalDotsWrapper.textContent += ".";
    }
  
  }
  
  const RenderTabsAsTree = (tabs, tab, renderedTabs, tabIdToIndex, level, refetchTabs, wrapper) => {
    console.log(tab.openerTabId, renderedTabs[tab.openerTabId]);
    if(tab.openerTabId && !renderedTabs[tab.openerTabId]) {
      console.log("recursion");
      RenderTabsAsTree(tabs, tabs[tabIdToIndex[tab.openerTabId]], renderedTabs, tabIdToIndex, 0, refetchTabs, wrapper);
    }
    if(!renderedTabs[tab.id]) {
      const tabWrapper = CreateTabElement(tab, tabs, refetchTabs, level);
      wrapper.appendChild(tabWrapper); 
      renderedTabs[tab.id] = true;
      if(tab.children) {
        tab.children.forEach(childId => {
          const newLevel = level + 1;
          console.log("further recursion");
          RenderTabsAsTree(tabs, tabs[tabIdToIndex[childId]], renderedTabs, tabIdToIndex, newLevel, refetchTabs, wrapper);
          AddHorizontalDotsForTreeLayout(childId);
        });
        console.log("add vertical");
        AddVerticalDotsForTreeLayout(tab);
      }
    }
  }
  
export const CreateTabElement = (tab, tabs, refetchTabs, level = 0) => {
  const tabWrapper = document.createElement("div");
  tabWrapper.className = "tab-wrapper";
  tabWrapper.setAttribute("id", "tab_wrapper_" + tab.id);
  tabWrapper.style.cssText =
    "display: flex; align-items:center; justify-content: space-around;" + "margin-left: " + level * 45 + "px;";

  const tabInfoWrapper = document.createElement("div");
  tabInfoWrapper.className = "tab-info-wrapper";
  tabInfoWrapper.setAttribute("id", "tab_info_wrapper_" + tab.id);
  tabInfoWrapper.setAttribute("tabindex", -1);
  tabInfoWrapper.addEventListener("click", focusOnTabEvent);
  tabInfoWrapper.tabId = tab.id;

  const siteWrapper = document.createElement("div");
  siteWrapper.style.cssText = "display:flex; width: 10%";
  const site = document.createElement("a");
  site.className = "site-link";
  if (tab.favIconUrl) {
    const favIcon = document.createElement("img");
    favIcon.src = tab.favIconUrl;
    favIcon.style.cssText = "width: 20px;height: 20px;margin-right: 5px;";
    siteWrapper.appendChild(favIcon);
    siteWrapper.appendChild(site);
  }

  const titleAndUpdatedAgoWrapper = document.createElement("div");
  titleAndUpdatedAgoWrapper.style.cssText =
    "display:flex; width: 90%; flex-direction: column;";

  const titleWrapper = document.createElement("div");
  titleWrapper.style.cssText = "display:flex; width: 100%";
  const title = document.createElement("a");
  title.setAttribute("id", "tab_" + tab.id);
  title.setAttribute("url", tab.url);
  title.className += "url-title-text";
  title.textContent = tab.title;
  titleWrapper.appendChild(title);

  const updatedAtElement = document.createElement("span");
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
  else updateAgo = "1m ago";

  updatedAtElement.textContent = updateAgo;
  const updatedAtElementWrapper = document.createElement("div");
  updatedAtElementWrapper.style.cssText = "display:flex; width: 100%;";
  updatedAtElementWrapper.appendChild(updatedAtElement);

  titleAndUpdatedAgoWrapper.appendChild(titleWrapper);
  titleAndUpdatedAgoWrapper.appendChild(updatedAtElementWrapper);

  tabInfoWrapper.appendChild(siteWrapper);
  tabInfoWrapper.appendChild(titleAndUpdatedAgoWrapper);
  tabInfoWrapper.appendChild(CreateTabMoreVertMenu(tab.id));

  const closeTab = document.createElement("div");
  closeTab.className = "close-button";
  const closeTabIcon = document.createElement("span");
  closeTabIcon.textContent = "close";
  closeTabIcon.className = "material-icons close-tab-icon";
  closeTab.appendChild(closeTabIcon);
  closeTab.addEventListener("click", onCloseTabEvent);
  closeTab.tabId = tab.id;
  closeTab.callback = () => refetchTabs();

  tabWrapper.appendChild(tabInfoWrapper);
  tabWrapper.appendChild(closeTab);
  return tabWrapper;
};

export const GetFirstTabInfoWrapperElement = () =>
  document.getElementsByClassName("tab-info-wrapper").length > 0
    ? document.getElementsByClassName("tab-info-wrapper")[0]
    : null;

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