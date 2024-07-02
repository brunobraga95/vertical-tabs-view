import Analytics from "./google-analytics.js";
import { getTabById } from "./tab_actions.js";
import { getViewMode, setViewMode, getSortBy } from "./storage.js";

let DUPLICATED_TABS_MAP = {};

document.getElementById("create-new-tab-button-wrapper").onclick = () => chrome.tabs.create({});

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

const getHeaderMoreVert = () => {
  const popups = document.getElementsByClassName("more-vert-header-popup");
  if (popups.length !== 1) return null;
  return popups[0];
};

const addItemToMoreVertMenu = (text, onClick, id) => {
  const popup = getHeaderMoreVert();
  if (!popup) return;

  const itemWrapper = document.createElement("div");
  itemWrapper.className = "more-vert-icon-item-wrapper";
  itemWrapper.textContent = text;
  itemWrapper.id = id;
  itemWrapper.addEventListener("click", onClick);
  popup.appendChild(itemWrapper);
};

document.getElementById("more-vert-icon-header").onclick = async (e) => {
  e.stopPropagation();
  const popup = getHeaderMoreVert();
  if (!popup) return;

  const isVisible = popup.style.visibility === "visible";
  popup.style.setProperty("visibility", !isVisible ? "visible" : "hidden");
  Analytics.fireEvent("more-vert-icon-clicked-header");
};

document.getElementById("body").onclick = async () => {
  const popup = getHeaderMoreVert();
  if (!popup) return;

  if (popup.style.visibility === "visible")
    popup.style.setProperty("visibility", "hidden");
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
    const openTabsCounter = document.getElementById("open-tabs-counter");
    openTabsCounter.textContent = tabs.length.toString();
  }
};

const HeaderChipWrapper = (title, topLevelId, leftTextId, onClick) => {
  const chipsHeaderWrapper = document.createElement("div");
  chipsHeaderWrapper.className = "chips-header-wrapper";
  const headerChipWrapper = document.createElement("div");
  headerChipWrapper.setAttribute("id", topLevelId);
  headerChipWrapper.className = "info-chip header-chip-wrapper";
  const chipHeaderText = document.createElement("span");
  chipHeaderText.className = "info-chip-text";
  chipHeaderText.textContent = title;
  headerChipWrapper.appendChild(chipHeaderText);
  const headerChipLeftText = document.createElement("div");
  headerChipLeftText.className = "chips-left-circle";
  const headerChipCounter = document.createElement("span");
  headerChipCounter.setAttribute("id", leftTextId);
  headerChipCounter.className = "chips-left-circle-text";
  headerChipLeftText.appendChild(headerChipCounter);
  headerChipWrapper.appendChild(headerChipLeftText);

  if (onClick) {
    const chipHeaderIcon = document.createElement("span");
    chipHeaderIcon.setAttribute("id", "duplicated-tabs-menu-icon");
    chipHeaderIcon.textContent = "more_vert";
    chipHeaderIcon.className = "material-icons popup-menu-icon";
    headerChipWrapper.appendChild(chipHeaderIcon);
    headerChipWrapper.addEventListener("click", onClick);
  }
  return headerChipWrapper;
};

const getTabsCounter = () => {
  return HeaderChipWrapper(
    "open tabs",
    "tabs-counter-wrapper",
    "open-tabs-counter",
  );
};

const DuplicatedTabs = (onRemoveDuplicates) => {
  const chipsHeaderWrapper = HeaderChipWrapper(
    "duplicated",
    "duplicated-tabs-wrapper",
    "duplicated-tabs-counter",
    showDuplicatedTabs,
  );
  chipsHeaderWrapper.style.cssText += " display: none;";
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
  chipsHeaderWrapper.appendChild(duplicatedTabsMenu);

  return chipsHeaderWrapper;
};

const createMoreVertPopupElements = async (
  currentSortMode,
  onSortedButtonClicked,
) => {
  const popup = getHeaderMoreVert();
  if (!popup) return;

  popup.innerHTML = "";
  addItemToMoreVertMenu("No sorting", async () => {
    Analytics.fireEvent("no_sorting_clicked");
    await onSortedButtonClicked("NONE");
  });
  addItemToMoreVertMenu("Sort tabs by last used", async () => {
    Analytics.fireEvent("sort_per_last_used_clicked");
    if (currentSortMode == "ACTIVE_ASC") currentSortMode = "ACTIVE_DESC";
    else currentSortMode = "ACTIVE_ASC";
    await onSortedButtonClicked(currentSortMode);
  });
  addItemToMoreVertMenu("Sort tabs by domain", async () => {
    Analytics.fireEvent("sort_per_domain_clicked");
    if (currentSortMode == "SITE_ASC") currentSortMode = "SITE_DESC";
    else currentSortMode = "SITE_ASC";
    await onSortedButtonClicked(currentSortMode);
  });
  addItemToMoreVertMenu("Group tabs by domain", async () => {
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
  });
  const viewMode = await getViewMode();
  console.log(viewMode);
  addItemToMoreVertMenu(
    viewMode === "tree" ? "List view" : "Tree view",
    async () => {
      const viewMode = await getViewMode();
      const newViewMode = viewMode === "list" ? "tree" : "list";
      setViewMode(newViewMode);
      Analytics.fireEvent("view_mode_" + newViewMode);
    },
  );

  const themeMode =
    (await chrome.storage.local.get("theme")).theme || "classic_mode";
  const toogleThemeModeId = "toogle_theme_mode";
  addItemToMoreVertMenu(
    `Use ${themeMode === "classic_mode" ? "dark" : "white"} mode`,
    async () => {
      Analytics.fireEvent("event_theme_toogle_clicked");
      const upToDateMode =
        (await chrome.storage.local.get("theme")).theme || "classic_mode";
      let entry = {};
      entry["theme"] =
        upToDateMode === "classic_mode" ? "dark_mode" : "classic_mode";
      chrome.storage.local.set(entry, function () {});
      document.getElementById(toogleThemeModeId).textContent = `Use ${
        entry["theme"] === "classic_mode" ? "dark" : "white"
      } mode`;
    },
    toogleThemeModeId,
  );

  addItemToMoreVertMenu("Rate this extention", () => {
    Analytics.fireEvent("Suggestions_button_clicked");
    window
      .open(
        "https://chromewebstore.google.com/detail/vertical-tabs-side-panel/nelmjkbalflkmcnnnhjgiodpndcebfgo/reviews",
        "_blank",
      )
      .focus();
  });
  addItemToMoreVertMenu("Suggestions and feedback", () => {
    Analytics.fireEvent("suggestions_button_clicked");
    window.open("https://forms.gle/pX1u5cpPRZFsPboo9", "_blank").focus();
  });
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

    const header = document.createElement("div");
    header.className = "header-child";
    header.appendChild(DuplicatedTabs(onRemoveDuplicates));
    header.appendChild(getTabsCounter());

    wrapper.appendChild(header);
    createMoreVertPopupElements(currentSortMode, onSortedButtonClicked);
  }
  ShowChipsIfNeeded(tabs);
  MaybeHighlightOrUnhighlightTabs(DUPLICATED_TABS_MAP);
};
