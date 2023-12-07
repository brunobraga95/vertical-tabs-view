import { CreateTabMoreVertMenu } from "./more_vert_utils.js";
import { focusOnTabEvent, onCloseTabEvent } from "./tab_actions.js";

export const GetCurrenTabsHtml = () => document.getElementById("tabs-list");
export const GetTabFromID = (id) =>
  document.getElementById("tab_wrapper_" + id);

export const CreateTabElement = (tab) => {
  const tabWrapper = document.createElement("div");
  tabWrapper.className = "tab-wrapper";
  tabWrapper.setAttribute("id", "tab_wrapper_" + tab.id);
  tabWrapper.style.cssText =
    "display: flex; align-items:center; justify-content: space-around;";

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
    "display:flex; width: 85%; flex-direction: column;";

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
  updatedAtElementWrapper.style.cssText = "display:flex; width: 90%;";
  updatedAtElementWrapper.appendChild(updatedAtElement);

  console.log(titleWrapper);
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

  tabWrapper.appendChild(tabInfoWrapper);
  tabWrapper.appendChild(closeTab);
  return tabWrapper;
};

export const GetFirstTabInfoWrapperElement = () =>
  document.getElementsByClassName("tab-info-wrapper").length > 0
    ? document.getElementsByClassName("tab-info-wrapper")[0]
    : null;
