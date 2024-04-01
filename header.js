import Analytics from "./google-analytics.js";
import { getTabById } from "./tab_actions.js";
import { getViewMode, setViewMode, getSortBy } from "./storage.js";

let DUPLICATED_TABS_MAP = {};

const closeDuplicatedTabsMenu = () => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  const duplicatedTabsMenuIcon = document.getElementById(
    "duplicated-tabs-menu-icon",
  );
  const duplicateTabsWrapper = document.getElementById(
    "duplicated-tabs-wrapper",
  );

  duplicatedTabsMenuIcon.style.cssText = "";
  duplicatedTabsMenu.style.cssText = duplicatedTabsMenu.style.cssText.replace(
    "display: block;",
    "",
  );
  duplicateTabsWrapper.classList.remove("highlight-duplicated-chip-popup-open");
};

const openDuplicatedTabsMenu = () => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  const duplicatedTabsMenuIcon = document.getElementById(
    "duplicated-tabs-menu-icon",
  );
  const duplicateTabsWrapper = document.getElementById(
    "duplicated-tabs-wrapper",
  );

  duplicatedTabsMenu.style.cssText =
    duplicatedTabsMenu.style.cssText + "display: block;";
  duplicatedTabsMenuIcon.style.cssText = "font-weight: 700 !important;";
  duplicateTabsWrapper.classList.add("highlight-duplicated-chip-popup-open");
};

// To close the popup on outside click in the menu.
document.addEventListener("click", (evt) => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  const duplicateTabsWrapper = document.getElementById(
    "duplicated-tabs-wrapper",
  );

  if (
    duplicatedTabsMenu &&
    duplicateTabsWrapper &&
    duplicatedTabsMenu.style.cssText.includes("display: block;") &&
    !duplicatedTabsMenu.contains(evt.target) &&
    !duplicateTabsWrapper.contains(evt.target)
  ) {
    closeDuplicatedTabsMenu();
  }
});

document.getElementById("suggestions_theme_icon").onclick = () =>
  Analytics.fireEvent("suggestions_button_clicked");
document.getElementById("donate_theme_icon").onclick = () =>
  Analytics.fireEvent("donate_button_clicked");
document.getElementById("toggle_theme_icon").onclick = async () => {
  Analytics.fireEvent("event_theme_toogle_clicked");
  const upToDateMode =
    (await chrome.storage.local.get("theme")).theme || "classic_mode";
  let entry = {};
  entry["theme"] =
    upToDateMode === "classic_mode" ? "dark_mode" : "classic_mode";
  chrome.storage.local.set(entry, function () {});
};

const showDuplicatedTabs = () => {
  Analytics.fireEvent("duplicated_tabs_menu_clicked");
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  if (!duplicatedTabsMenu.style.cssText.includes("display: block;")) {
    openDuplicatedTabsMenu();
  } else {
    closeDuplicatedTabsMenu();
  }
};

export const AreDuplicatedHighlighted = () => {
  const highlightDuplicatedItemText = document.getElementById(
    "duplicated-tabs-text",
  );
  return highlightDuplicatedItemText.textContent === "unhighlight duplicated";
};

const HighLightOrUnHighLightDuplicated = () => {
  Analytics.fireEvent("highlight_or_unhighlight_duplicated_tabs_clicked");
  const duplicatedTabsMap = DUPLICATED_TABS_MAP;
  if (AreDuplicatedHighlighted()) {
    UnhighLightDuplicatedTabs(duplicatedTabsMap);
  } else {
    HighLightDuplicatedTabs(duplicatedTabsMap);
  }
};

const UnhighLightDuplicatedTabs = (duplicatedTabsMap) => {
  const duplicateTabsWrapper = document.getElementById(
    "duplicated-tabs-wrapper",
  );
  const highlightDuplicatedItemText = document.getElementById(
    "duplicated-tabs-text",
  );

  duplicateTabsWrapper.classList.remove("highlighted-duplicated-tabs");
  highlightDuplicatedItemText.textContent = "highlight duplicated";
  Object.keys(duplicatedTabsMap).forEach((url) => {
    duplicatedTabsMap[url].tabs.forEach((tab) => {
      const tabInfoWrapper = getTabById(tab.id);
      if (!tabInfoWrapper) {
        // continue;
      }
      tabInfoWrapper.style.cssText = tabInfoWrapper.style.cssText.replace(
        "border: 1px solid rgb(0, 180, 204);",
        "",
      );
    });
  });
};

const HighLightDuplicatedTabs = (duplicatedTabsMap) => {
  const duplicateTabsWrapper = document.getElementById(
    "duplicated-tabs-wrapper",
  );
  const highlightDuplicatedItemText = document.getElementById(
    "duplicated-tabs-text",
  );

  duplicateTabsWrapper.classList.add("highlighted-duplicated-tabs");
  highlightDuplicatedItemText.textContent = "unhighlight duplicated";

  Object.keys(duplicatedTabsMap).forEach((url) => {
    if (duplicatedTabsMap[url].counter > 1) {
      duplicatedTabsMap[url].tabs.forEach((tab) => {
        const tabInfoWrapper = getTabById(tab.id);
        tabInfoWrapper.style.cssText += "border: 2px solid rgb(0, 180, 204);";
      });
    }
  });
};

const HasDuplicatedTabs = (duplicatedTabsMap) => {
  let duplicated = false;
  Object.keys(duplicatedTabsMap).forEach((url) => {
    duplicated |= duplicatedTabsMap[url].counter > 1;
  });
  return duplicated;
};

export const MaybeHighlightOrUnhighlightTabs = (duplicatedTabsMap) => {
  if (!HasDuplicatedTabs(duplicatedTabsMap)) {
    UnhighLightDuplicatedTabs(duplicatedTabsMap);
  }
  if (AreDuplicatedHighlighted()) {
    HighLightDuplicatedTabs(duplicatedTabsMap);
  }
};

const RemoveDuplicated = async (e) => {
  Analytics.fireEvent("remove_duplicated_tabs_clicked");
  const duplicatedTabsMap = DUPLICATED_TABS_MAP;
  const callback = e.currentTarget.callback;
  const sortBy = await getSortBy();

  let ids = [];
  let hasActive = false;
  Object.keys(duplicatedTabsMap).forEach((url) => {
    if (duplicatedTabsMap[url].counter > 1) {
      duplicatedTabsMap[url].tabs.forEach((tab, i) => {
        if (!tab.active) {
          ids.push(tab.id);
        } else {
          hasActive = true;
        }
      });
      if (!hasActive) {
        ids.pop();
      }
    }
  });
  callback(ids, sortBy);
};

const getDuplicatedTabs = (tabs) => {
  let duplicatedTabsMap = {};
  for (let i = 0; i < tabs.length; i++) {
    if (!duplicatedTabsMap[tabs[i].url]) {
      duplicatedTabsMap[tabs[i].url] = {
        tabs: [tabs[i]],
        counter: 1,
      };
    } else {
      duplicatedTabsMap[tabs[i].url].counter =
        duplicatedTabsMap[tabs[i].url].counter + 1;
      duplicatedTabsMap[tabs[i].url].tabs.push(tabs[i]);
    }
  }
  return duplicatedTabsMap;
};

export const ShowChipsIfNeeded = (tabs) => {
  const duplicatedTabsMap = getDuplicatedTabs(tabs);
  let duplicatesCounter = 0;

  Object.keys(duplicatedTabsMap).forEach((url) => {
    if (duplicatedTabsMap[url].counter > 1) {
      duplicatesCounter += duplicatedTabsMap[url].counter;
    }
  });
  const duplicateTabsCounter = document.getElementById(
    "duplicated-tabs-counter",
  );
  const duplicateTabsWrapper = document.getElementById(
    "duplicated-tabs-wrapper",
  );

  if (duplicatesCounter > 0) {
    duplicateTabsWrapper.style.cssText += " display: flex;";
    duplicateTabsCounter.textContent = duplicatesCounter.toString();
  } else {
    duplicateTabsWrapper.style.cssText += " display: none;";
  }

  if (tabs.length > 0) {
    const openTabsWrapper = document.getElementById("open-tabs-wrapper");
    const openTabsCounter = document.getElementById("open-tabs-counter");

    openTabsWrapper.style.cssText += " display: flex;";
    openTabsCounter.textContent = tabs.length.toString();
  }
};

const AddIconButton = (label, icon, onClick, elementId, iconId) => {
  const iconButton = document.createElement("div");
  iconButton.className = "header-element title-header-wrapper";
  const iconLabel = document.createElement("span");
  iconLabel.setAttribute("id", elementId);
  iconLabel.className = "header-button";
  iconLabel.textContent = label;
  const iconElement = document.createElement("span");
  iconElement.textContent = icon;
  iconElement.setAttribute("id", iconId);
  iconElement.className = "material-icons headerIcon";
  iconButton.appendChild(iconLabel);
  iconButton.appendChild(iconElement);
  iconButton.addEventListener("click", () => onClick(iconButton));
  return iconButton;
};

const SiteSortingButton = (onSortedButtonClicked, currentSortMode) => {
  return AddIconButton(
    "site",
    "sort",
    async () => {
      Analytics.fireEvent("sort_per_domain_clicked");
      if (currentSortMode == "SITE_ASC") currentSortMode = "SITE_DESC";
      else currentSortMode = "SITE_ASC";
      await onSortedButtonClicked(currentSortMode);
    },
    "siteHeader",
    "siteHeaderIcon",
  );
};

const GroupTabsBySiteButton = () => {
  return AddIconButton(
    "group sites",
    "sort",
    async () => {
      chrome.permissions.request(
        {
          permissions: ["tabGroups"],
        },
        async (granted) => {
          // The callback argument will be true if the user granted the permissions.
          if (granted) {
            Analytics.fireEvent("group_tabs_by_site");
            const getSiteFromTabUrl = (tab) => {
              let site = tab?.url ? new URL(tab.url) : { hostname: "" };
              site = site.hostname.replace("www.", "");
              return site.split(".").length > 2
                ? site.split(".")[0] + "." + site.split(".")[1]
                : site.split(".")[0];
            };

            // first add to existing groups
            const groups = (await chrome.tabGroups.query({})) || [];
            let existingGroupTitleToId = {};
            for (let group of groups) {
              existingGroupTitleToId[group.title] = group.id;
            }
            let tabs = await chrome.tabs.query({});
            let sites = {};
            for (let tab of tabs) {
              if (tab.groupId === -1) {
                const site = getSiteFromTabUrl(tab);
                if (existingGroupTitleToId[site]) {
                  await chrome.tabs.group({
                    tabIds: [tab.id],
                    groupId: existingGroupTitleToId[site],
                  });
                } else {
                  sites[site] = !sites[site] ? 1 : sites[site] + 1;
                }
              }
            }

            const tabsToGroup = {};
            for (let tab of tabs) {
              const site = getSiteFromTabUrl(tab);
              if (sites[site] > 1 && tab.groupId === -1) {
                if (!tabsToGroup[site]) {
                  tabsToGroup[site] = { name: site, tabs: [tab.id] };
                } else {
                  tabsToGroup[site].tabs.push(tab.id);
                }
              }
            }
            for (let site in tabsToGroup) {
              const randomColor = () => {
                const colors = Object.keys(chrome.tabGroups.Color);
                const colorKey =
                  colors[Math.floor(Math.random() * colors.length)];
                return chrome.tabGroups.Color[colorKey];
              };

              const groupdId = await chrome.tabs.group({
                tabIds: tabsToGroup[site].tabs,
              });
              await chrome.tabGroups.update(groupdId, {
                title: site,
                color: randomColor(),
              });
            }
          } else {
            Analytics.fireEvent("group_tabs_by_site_permission_declined");
          }
        },
      );
    },
    "groupSitesHeader",
    "groupSitesHeaderIcon",
  );
};

const ActiveSortingButton = (onSortedButtonClicked, currentSortMode) => {
  return AddIconButton(
    "active",
    "sort",
    async () => {
      Analytics.fireEvent("sort_per_last_used_clicked");
      if (currentSortMode == "ACTIVE_ASC") currentSortMode = "ACTIVE_DESC";
      else currentSortMode = "ACTIVE_ASC";
      await onSortedButtonClicked(currentSortMode);
    },
    "activeHeader",
    "activeHeaderIcon",
  );
};

const TreeViewButton = () => {
  let button = AddIconButton(
    "tree view",
    "account_tree",
    async () => {
      const viewMode = await getViewMode();
      const newViewMode = viewMode === "list" ? "tree" : "list";
      setViewMode(newViewMode);
      Analytics.fireEvent("view_mode_" + newViewMode);
    },
    "treeHeader",
    "treeHeaderIcon",
  );

  return button;
};

const DuplicatedTabs = (onRemoveDuplicates) => {
  const chipsHeaderWrapper = document.createElement("div");
  chipsHeaderWrapper.className = "chips-header-wrapper";
  // duplicated tabs
  const duplicatedTabsHeaderWrapper = document.createElement("div");
  duplicatedTabsHeaderWrapper.setAttribute("id", "duplicated-tabs-wrapper");
  duplicatedTabsHeaderWrapper.className = "info-chip duplicated-tabs-wrapper";
  const duplicatedTablsHeader = document.createElement("span");
  duplicatedTablsHeader.className = "info-chip-text";
  duplicatedTablsHeader.textContent = "duplicated";
  duplicatedTabsHeaderWrapper.appendChild(duplicatedTablsHeader);
  const duplicatedTabsCounter = document.createElement("div");
  duplicatedTabsCounter.className = "chips-left-circle";
  const duplicatedCountText = document.createElement("span");
  duplicatedCountText.setAttribute("id", "duplicated-tabs-counter");
  duplicatedCountText.className = "chips-left-circle-text";
  duplicatedTabsCounter.appendChild(duplicatedCountText);
  duplicatedTabsHeaderWrapper.appendChild(duplicatedTabsCounter);

  const duplicatedTabsMenuIcon = document.createElement("span");
  duplicatedTabsMenuIcon.setAttribute("id", "duplicated-tabs-menu-icon");
  duplicatedTabsMenuIcon.textContent = "more_vert";
  duplicatedTabsMenuIcon.className = "material-icons popup-menu-icon";
  duplicatedTabsHeaderWrapper.appendChild(duplicatedTabsMenuIcon);
  duplicatedTabsHeaderWrapper.addEventListener("click", showDuplicatedTabs);

  const duplicatedTabsMenu = document.createElement("div");
  duplicatedTabsMenu.className = "popup-menu";
  duplicatedTabsMenu.setAttribute("id", "duplicated-tabs-menu");

  const highlightDuplicatedItem = document.createElement("div");
  highlightDuplicatedItem.className = "popup-menu-item";
  highlightDuplicatedItem.addEventListener(
    "click",
    HighLightOrUnHighLightDuplicated,
  );

  const highlightDuplicatedItemText = document.createElement("span");
  highlightDuplicatedItemText.setAttribute("id", "duplicated-tabs-text");
  highlightDuplicatedItemText.className = "popup-menu-item-text";
  highlightDuplicatedItemText.textContent = "highlight duplicated";

  highlightDuplicatedItem.appendChild(highlightDuplicatedItemText);

  const removeDuplicatedItem = document.createElement("div");
  removeDuplicatedItem.className = "popup-menu-item";
  removeDuplicatedItem.addEventListener("click", RemoveDuplicated);
  removeDuplicatedItem.callback = onRemoveDuplicates;

  const removeDuplicatedItemText = document.createElement("span");
  removeDuplicatedItemText.className = "popup-menu-item-text";
  removeDuplicatedItemText.textContent = "remove duplicated";

  removeDuplicatedItem.appendChild(removeDuplicatedItemText);

  duplicatedTabsMenu.appendChild(highlightDuplicatedItem);
  duplicatedTabsMenu.appendChild(removeDuplicatedItem);
  duplicatedTabsHeaderWrapper.appendChild(duplicatedTabsMenu);

  chipsHeaderWrapper.appendChild(duplicatedTabsHeaderWrapper);
  return chipsHeaderWrapper;
};

export const CreateHeader = async (
  tabs,
  onSortedButtonClicked,
  onRemoveDuplicates,
) => {
  let wrapper = document.getElementById("header");
  DUPLICATED_TABS_MAP = getDuplicatedTabs(tabs);

  if (wrapper.children.length === 0) {
    const currentSortMode = await getSortBy();
    const siteSortingButton = SiteSortingButton(
      onSortedButtonClicked,
      currentSortMode,
    );
    const groupTabsBySiteButton = GroupTabsBySiteButton();
    const duplicatedTabs = DuplicatedTabs(onRemoveDuplicates);
    const activeSortingButton = ActiveSortingButton(
      onSortedButtonClicked,
      currentSortMode,
    );

    const header = document.createElement("div");
    header.className = "header-child";
    const leftElementsHeader = document.createElement("div");
    leftElementsHeader.className = "left-elements-wrapper";
    leftElementsHeader.appendChild(siteSortingButton);
    leftElementsHeader.appendChild(activeSortingButton);
    header.appendChild(leftElementsHeader);
    header.appendChild(TreeViewButton());
    header.appendChild(duplicatedTabs);
    header.appendChild(groupTabsBySiteButton);

    wrapper.appendChild(header);
  }
  ShowChipsIfNeeded(tabs);
  MaybeHighlightOrUnhighlightTabs(DUPLICATED_TABS_MAP);
};
