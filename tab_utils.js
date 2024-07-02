import { CreateTabMoreVertMenu } from "./more_vert_utils.js";
import { focusOnTabEvent, onCloseTabEvent } from "./tab_actions.js";
import { getViewMode } from "./storage.js";
import { COLOR_SCHEMES } from "./colors.js";

export const GetCurrenTabsHtml = () => document.getElementById("tabs-list");
export const GetTabWrapperFromID = (id) =>
  document.getElementById("tab_wrapper_" + id);
export const GetTabIdFromTabWrapperElement = (tab) => {
  return tab.id.split("tab_wrapper_")[1];
};

export const getTabWrapperInfoById = (id) =>
  document.getElementById("tab_info_wrapper_" + id);

const AddHorizontalDotsForTreeLayout = (tabId) => {
  let tab = GetTabWrapperFromID(tabId);

  const horizontalDotsWrapper = document.createElement("div");
  horizontalDotsWrapper.className = "horizontal-dots-wrapper";
  horizontalDotsWrapper.innerText = ".....";

  tab.appendChild(horizontalDotsWrapper);
};

export const AddVerticalDotsForTreeLayout = (parentTab, children = []) => {
  if (children.length === 0) return;

  let lowestChildTab = null;
  children.forEach((childId) => {
    let childTab = GetTabWrapperFromID(childId);
    if (childTab) {
      if (!lowestChildTab) lowestChildTab = childTab;

      if (
        childTab.getBoundingClientRect().top >
        lowestChildTab.getBoundingClientRect().top
      ) {
        lowestChildTab = childTab;
      }
    }
  });

  if (!lowestChildTab) return;

  let tabHtml = GetTabWrapperFromID(parentTab);
  const elements = tabHtml.getElementsByClassName("vertical-dots-wrapper");
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }

  const verticalDotsWrapper = document.createElement("div");
  verticalDotsWrapper.className = "vertical-dots-wrapper";
  const expectedHeight =
    lowestChildTab.getBoundingClientRect().top -
    tabHtml.getBoundingClientRect().bottom +
    (lowestChildTab.getBoundingClientRect().bottom -
      lowestChildTab.getBoundingClientRect().top) /
      2 -
    4;
  verticalDotsWrapper.style.height = `${expectedHeight}px`;
  tabHtml.appendChild(verticalDotsWrapper);
  for (let i = 0; i < 1000; i++) {
    verticalDotsWrapper.textContent += ".";
  }
};

const RenderTabsAsTree = (
  tabs,
  tab,
  renderedTabs,
  tabIdToIndex,
  level,
  refetchTabs,
  wrapper,
  viewMode,
) => {
  if (tab.openerTabId && !renderedTabs[tab.openerTabId]) {
    RenderTabsAsTree(
      tabs,
      tabs[tabIdToIndex[tab.openerTabId]],
      renderedTabs,
      tabIdToIndex,
      0,
      refetchTabs,
      wrapper,
      viewMode,
    );
  }
  if (!renderedTabs[tab.id]) {
    const tabWrapper = CreateTabElement(
      tab,
      tabs,
      refetchTabs,
      level,
      viewMode,
    );
    wrapper.appendChild(tabWrapper);
    renderedTabs[tab.id] = true;
    if (tab.children) {
      tab.children.forEach((childId) => {
        const newLevel = level + 1;
        RenderTabsAsTree(
          tabs,
          tabs[tabIdToIndex[childId]],
          renderedTabs,
          tabIdToIndex,
          newLevel,
          refetchTabs,
          wrapper,
          viewMode,
        );
        AddHorizontalDotsForTreeLayout(childId);
      });
      AddVerticalDotsForTreeLayout(tab.id, tab.children);
    }
  }
};

export const CreateTabElement = (
  tab,
  tabs,
  refetchTabs,
  level = 0,
  viewMode = "list",
) => {
  const tabWrapper = document.createElement("div");
  tabWrapper.className = "tab-wrapper";
  tabWrapper.setAttribute("id", "tab_wrapper_" + tab.id);
  tabWrapper.style.cssText =
    "display: flex; align-items:center; justify-content: space-around;" +
    "margin-left: " +
    level * 45 +
    "px;";

  const tabInfoWrapper = document.createElement("div");
  tabInfoWrapper.className = "tab-info-wrapper";
  tabInfoWrapper.setAttribute("id", "tab_info_wrapper_" + tab.id);
  tabInfoWrapper.setAttribute("tabindex", -1);
  tabInfoWrapper.addEventListener("click", focusOnTabEvent);
  tabInfoWrapper.tabId = tab.id;

  const siteWrapper = document.createElement("div");
  siteWrapper.className = "site-wrapper";
  const site = document.createElement("a");
  site.className = "site-link";
  const favIcon = document.createElement("img");
  favIcon.setAttribute("id", "tab_icon_" + tab.id);
  favIcon.src = tab.favIconUrl || "";
  favIcon.style.cssText = "width: 20px;height: 20px;";
  siteWrapper.appendChild(favIcon);
  siteWrapper.appendChild(site);

  const titleAndUpdatedAgoWrapper = document.createElement("div");
  titleAndUpdatedAgoWrapper.style.cssText =
    "display:flex; width: calc(100% - 48px); flex-direction: column; margin-left: 7px";

  const titleWrapper = document.createElement("div");
  titleWrapper.style.cssText = "display:flex; width: 100%";
  const title = document.createElement("a");
  title.setAttribute("id", "tab_title_" + tab.id);
  title.setAttribute("url", tab.url);
  title.className += "url-title-text";
  title.textContent = tab.title;
  titleWrapper.appendChild(title);

  const updatedAtElement = document.createElement("span");
  updatedAtElement.setAttribute("id", "tab_updated_ago_" + tab.id);
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
  if (viewMode === "list") {
    // TODO: Decide if I want to keep this.
    // tabInfoWrapper.appendChild(CreateTabMoreVertMenu(tab.id));
  }
  const closeTab = document.createElement("div");
  closeTab.className = "close-button";
  const closeTabIcon = document.createElement("span");
  closeTabIcon.textContent = "close";
  closeTabIcon.className = "material-icons close-tab-icon";
  closeTab.appendChild(closeTabIcon);
  closeTab.addEventListener("click", onCloseTabEvent);
  closeTab.tabId = tab.id;
  closeTab.callback = () => refetchTabs();
  tabInfoWrapper.appendChild(closeTab);
  tabWrapper.appendChild(tabInfoWrapper);
  return tabWrapper;
};

export const GetFirstTabInfoWrapperElement = () =>
  document.getElementsByClassName("tab-info-wrapper").length > 0
    ? document.getElementsByClassName("tab-info-wrapper")[0]
    : null;

export const GetAllTabInfoWrappers = () =>
  document.getElementsByClassName("tab-info-wrapper").length > 0
    ? document.getElementsByClassName("tab-info-wrapper")
    : [];

export const UnselectTabInfoWrapper = async (tabInfoWrapper) => {
  tabInfoWrapper.style.removeProperty("background-color");
  tabInfoWrapper.classList.remove("focused-tab-info-wrapper");
};
export const ToogleTabInfoWrapperSelected = async (tabInfoWrapper) => {
  const theme =
    (await chrome.storage.local.get("theme")).theme || "classic_mode";
  tabInfoWrapper.style.backgroundColor = !tabInfoWrapper.classList.contains(
    "focused-tab-info-wrapper",
  )
    ? COLOR_SCHEMES[theme].focusTabColor
    : COLOR_SCHEMES[theme].tabWrapperColor;
  tabInfoWrapper.classList.toggle("focused-tab-info-wrapper");
};

export const CreateAndAppendTabsAsList = async (tabs, refetchTabs, wrapper) => {
  const viewMode = await getViewMode();
  if (viewMode === "tree") {
    let tabIdToIndex = {};
    tabs.forEach((tab, i) => (tabIdToIndex[tab.id] = i));
    let renderedTabs = {};
    tabs.forEach((tab) =>
      RenderTabsAsTree(
        tabs,
        tab,
        renderedTabs,
        tabIdToIndex,
        0,
        refetchTabs,
        wrapper,
        viewMode,
      ),
    );
  } else {
    tabs.forEach(async (tab) => {
      const tabWrapper = CreateTabElement(tab, tabs, viewMode);
      wrapper.appendChild(tabWrapper);
    });
  }
};
