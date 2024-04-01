import Analytics from "./google-analytics.js";
import { focusOnTab } from "./tab_actions.js";
import { COLOR_SCHEMES } from "./colors.js";

let timeout = null;
let searchTimeout = null;
let logSearchedUsedTime = null;

const DebounceLogSearchUsed = () => {
  const later = () => {
    clearTimeout(logSearchedUsedTime);
    Analytics.fireEvent("search_used");
  };
  clearTimeout(logSearchedUsedTime);
  logSearchedUsedTime = setTimeout(later, 10000);
};

const DebounceSearchBoxTyped = (func, wait) => {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(searchTimeout);
      func(...args);
      DebounceLogSearchUsed();
    };
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(later, wait);
  };
};

export const FilterBasedOnSearchValue = async (text) => {
  let value = text.toLowerCase();
  Array.from(document.getElementsByClassName("vertical-dots-wrapper")).forEach(
    (dots) => {
      dots.style.display = value !== "" ? "none" : "block";
    },
  );
  Array.from(
    document.getElementsByClassName("horizontal-dots-wrapper"),
  ).forEach((dots) => {
    dots.style.display = value !== "" ? "none" : "block";
  });
  Array.from(document.getElementsByClassName("tab-wrapper")).forEach((tab) => {
    if (value === "") {
      tab.classList.remove("no-margin");
    } else {
      tab.classList.add("no-margin");
    }
  });

  let urlList = document.getElementsByClassName("tab-wrapper");
  let firstVisibleFound = false;
  const theme =
    (await chrome.storage.local.get("theme")).theme || "classic_mode";
  for (let i = 0; i < urlList.length; i++) {
    let url = urlList[i];
    let tabInfo = url.childNodes[0];
    let urlValue =
      url.childNodes[0].childNodes[1].childNodes[0].childNodes[0].attributes[1]
        .textContent || "";
    let titleValue =
      url.childNodes[0].childNodes[1].childNodes[0].innerText || "";
    urlValue = urlValue.toLowerCase();
    titleValue = titleValue.toLowerCase();
    if (
      value != "" &&
      !urlValue.includes(value) &&
      !titleValue.includes(value)
    ) {
      url.style.cssText = url.style.cssText + "display:none !important";
      if (tabInfo.classList.contains("focused-tab-info-wrapper")) {
        tabInfo.classList.remove("focused-tab-info-wrapper");
      }
      // tabInfo.style.backgroundColor = COLOR_SCHEMES[theme].tabWrapperColor;
      tabInfo.classList.remove("focused-tab-info-wrapper");
    } else {
      url.style.cssText = url.style.cssText.replace(
        "display: none !important",
        "",
      );
      if (!firstVisibleFound) {
        tabInfo.classList.add("focused-tab-info-wrapper");
        tabInfo.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
        firstVisibleFound = true;
      } else {
        if (tabInfo.classList.contains("focused-tab-info-wrapper")) {
          tabInfo.classList.remove("focused-tab-info-wrapper");
        }
        // tabInfo.style.backgroundColor = COLOR_SCHEMES[theme].tabWrapperColor;
        tabInfo.classList.remove("focused-tab-info-wrapper");
      }
    }
  }
};

const onSearchChanged = DebounceSearchBoxTyped(
  (e) => {
    FilterBasedOnSearchValue(e.target.value.toLowerCase());
  },
  300,
  searchTimeout,
);

const onKeyDownPressed = async (e) => {
  const isCurrentTabFocused = (tab) => {
    let title = tab.childNodes[0];
    if (title.classList.contains("focused-tab-info-wrapper")) {
      return title;
    }
    return null;
  };

  const removeFocusFromAllTabsButOne = async (tabsList, safeTabIndex) => {
    const theme =
      (await chrome.storage.local.get("theme")).theme || "classic_mode";
    for (let i = 0; i < tabsList.length; i++) {
      if (i !== safeTabIndex) {
        const tab = tabsList[i];
        let title = tab.childNodes[0];
        title.classList.remove("focused-tab-info-wrapper");
        title.style.removeProperty("background-color");
      }
    }
  };

  const temporarilyRemoveHover = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    let wrapper = document.getElementById("tabs-list");
    wrapper.classList.add("focused-tab-info-wrapper-no-hover");
    timeout = setTimeout(
      () => wrapper.classList.remove("focused-tab-info-wrapper-no-hover"),
      2000,
    );
  };

  const maybeFocusOnTab = async (tab, currentlyFocused) => {
    temporarilyRemoveHover();
    let title = tab.childNodes[0];
    if (
      !tab.style.cssText.includes("display: none") &&
      currentlyFocused &&
      !title.classList.contains("focused-tab-info-wrapper")
    ) {
      const theme =
        (await chrome.storage.local.get("theme")).theme || "classic_mode";
      currentlyFocused.classList.remove("focused-tab-info-wrapper");
      currentlyFocused.style.backgroundColor =
        COLOR_SCHEMES[theme].tabWrapperColor;
      title.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
      title.classList.add("focused-tab-info-wrapper");
      title.scrollIntoView({ block: "center", behavior: "smooth" });
      return true;
    }
    return false;
  };

  let loopedCompleted = false;
  if (e.code === "ArrowDown" || (e.code === "Tab" && !e.shiftKey)) {
    Analytics.fireEvent("arrow_or_tab_navigated");
    let currentlyFocused = null;
    let focusedOnTab = false;
    let tabList = document.getElementsByClassName("tab-wrapper");
    for (let i = 0; i < tabList.length; i++) {
      let tab = tabList[i];
      if (!currentlyFocused) {
        currentlyFocused = isCurrentTabFocused(tab);
      }
      if (!focusedOnTab && (await maybeFocusOnTab(tab, currentlyFocused))) {
        removeFocusFromAllTabsButOne(tabList, i);
        break;
      }
      // loopedCompleted avoid unwanted infinite loop
      if (i === tabList.length - 1 && !loopedCompleted) {
        loopedCompleted = true;
        i = -1;
      }
    }
  }

  if (e.code === "ArrowUp" || (e.code === "Tab" && e.shiftKey)) {
    Analytics.fireEvent("arrow_or_tab_navigated");
    let currentlyFocused = null;
    let tabList = document.getElementsByClassName("tab-wrapper");
    for (let i = tabList.length - 1; i >= 0; i--) {
      let tab = tabList[i];
      if (!currentlyFocused) {
        currentlyFocused = isCurrentTabFocused(tab);
      }
      if (await maybeFocusOnTab(tab, currentlyFocused)) {
        removeFocusFromAllTabsButOne(tabList, i);
        break;
      }
      // loopedCompleted avoid unwanted infinite loop
      if (i === 0 && !loopedCompleted) {
        loopedCompleted = true;
        i = tabList.length;
      }
    }
  }
};

const focusOnTabKeyPress = (e) => {
  if (e.code === "Enter") {
    let urlList = document.getElementsByClassName("tab-wrapper");
    for (let i = urlList.length - 1; i >= 0; i--) {
      let url = urlList[i];
      let title = url.childNodes[0];
      if (title.classList.contains("focused-tab-info-wrapper")) {
        const id = parseInt(url.getAttribute("id").split("tab_wrapper_")[1]);
        focusOnTab(id);
      }
    }
  }
};

document
  .getElementById("search-bar")
  .addEventListener("input", onSearchChanged);
document
  .getElementById("search-bar")
  .addEventListener("keydown", onKeyDownPressed);
document
  .getElementById("search-bar")
  .addEventListener("keypress", focusOnTabKeyPress);
