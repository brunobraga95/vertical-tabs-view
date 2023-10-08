import Analytics from "./google-analytics.js";
import { CloseAllTabsWithIds } from "./tab_actions.js";
import { COLOR_SCHEMES } from "./colors.js";
import { GetCurrenTabsHtml } from "./tab_utils.js";

const CloseAllTabsFromId = (e) => {
  Analytics.fireEvent("close_all_to_the_bottom");
  const id = e.currentTarget.tabId;
  const currentTabsList = GetCurrenTabsHtml();
  let tabs = [];
  for (let i = 0; i < currentTabsList.children.length; i++) {
    tabs.push(
      parseInt(
        currentTabsList.children[i].getAttribute("id").split("tab_wrapper_")[1],
      ),
    );
  }
  let found = false;
  let ids = [];
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i] == id) {
      found = true;
    } else if (found) {
      ids.push(tabs[i]);
    }
  }
  CloseAllTabsWithIds(ids);
};

const showTabMoreVertMenu = async (e) => {
  e.stopPropagation();
  Analytics.fireEvent("show_tab_more_vert_menu");
  const id = e.currentTarget.tabId;
  const showTabMoreVertMenu = document.getElementById(
    "tab-more-vert-menu_" + id,
  );
  const showTabMoreVertMenuIcon = document.getElementById(
    "show-tab-more-vert-menu-icon_" + id,
  );

  if (!showTabMoreVertMenu.style.cssText.includes("display: block;")) {
    showTabMoreVertMenu.style.cssText =
      showTabMoreVertMenu.style.cssText + "display: block;";
    showTabMoreVertMenuIcon.style.color = "black";
  } else {
    showTabMoreVertMenu.style.cssText =
      showTabMoreVertMenu.style.cssText.replace("display: block;", "");
    const theme =
      (await chrome.storage.local.get("theme")).theme || "classic_mode";
    showTabMoreVertMenuIcon.style.color =
      COLOR_SCHEMES[theme].updateAgoTextColor;
  }
};

export const CreateTabMoreVertMenu = (tabId) => {
  const tabMoreVertMenuIcon = document.createElement("div");
  tabMoreVertMenuIcon.className = "more-vert-button more-vert-all-button left";
  tabMoreVertMenuIcon.setAttribute(
    "id",
    "show-tab-more-vert-menu-icon_" + tabId,
  );
  const closeAllCloseIcon = document.createElement("span");
  closeAllCloseIcon.textContent = "more_vert";
  closeAllCloseIcon.className = "material-icons more-vert";
  tabMoreVertMenuIcon.appendChild(closeAllCloseIcon);
  tabMoreVertMenuIcon.addEventListener("click", showTabMoreVertMenu);
  tabMoreVertMenuIcon.tabId = tabId;

  const tabMoreVertMenu = document.createElement("div");
  tabMoreVertMenu.className = "popup-menu";
  tabMoreVertMenu.style.cssText = "top: 25px; right:-15px; width: 160px;";
  tabMoreVertMenu.setAttribute("id", "tab-more-vert-menu_" + tabId);

  const closeAllToTheBottomItem = document.createElement("div");
  closeAllToTheBottomItem.className = "popup-menu-item";
  closeAllToTheBottomItem.tabId = tabId;
  closeAllToTheBottomItem.addEventListener("click", CloseAllTabsFromId);

  const closeAllToTheBottomItemText = document.createElement("span");
  closeAllToTheBottomItemText.setAttribute("id", "tab-more-vert-text");
  closeAllToTheBottomItemText.className = "popup-menu-item-text";
  closeAllToTheBottomItemText.textContent = "Close all to the bottom";
  closeAllToTheBottomItem.appendChild(closeAllToTheBottomItemText);
  tabMoreVertMenu.appendChild(closeAllToTheBottomItem);

  tabMoreVertMenuIcon.appendChild(tabMoreVertMenu);

  return tabMoreVertMenuIcon;
};
