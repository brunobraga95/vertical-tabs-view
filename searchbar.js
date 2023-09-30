import { focusOnTab } from "./tab_utils.js";
import { getRenderedRows, getCurrentTheme, removeFocusClass, containsFocusClass } from "./utils.js";
import { COLOR_SCHEMES } from "./popup.js";

let timeout = null;

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
  
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

export const filterBasedOnSearchValue = async (text) => {
  let value = text.toLowerCase();
  let renderedRow = getRenderedRows();
  const theme = await getCurrentTheme();
  let firstVisibleFound = false;

  for(let i = 0; i < renderedRow.length; i++) {
    let row = renderedRow[i];
    let tabInfo = row.childNodes[0];
    let urlValue = row.childNodes[0].childNodes[1].childNodes[0].attributes[1].textContent || "";
    let titleValue = row.childNodes[0].childNodes[1].childNodes[0].innerText || "";
    urlValue = urlValue.toLowerCase();
    titleValue = titleValue.toLowerCase();
    if(value != "" && !urlValue.includes(value) && !titleValue.includes(value)) {
      row.style.cssText = row.style.cssText + "display:none !important";
      removeFocusClass(tabInfo);
      tabInfo.style.backgroundColor = COLOR_SCHEMES[theme].tabWrapperColor;  
      removeFocusClass(tabInfo);
    } else {
      row.style.cssText = row.style.cssText.replace("display: none !important", "");
      if (!firstVisibleFound) {
        tabInfo.classList.add("focused-tab-info-wrapper");
        tabInfo.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
        firstVisibleFound = true;
      } else {
        removeFocusClass(tabInfo);
        tabInfo.style.backgroundColor = COLOR_SCHEMES[theme].tabWrapperColor;  
        removeFocusClass(tabInfo);
      }
    }
  }
}
const onSearchChanged = debounce((e) => {
  filterBasedOnSearchValue(e.target.value.toLowerCase());
}, 300);

const onKeyDownPressed = async (e) => {
  const isCurrentTabFocused = (tab) => {
    let title = tab.childNodes[0];

    if (containsFocusClass(title)) {
      return title;
    }
    return null;
  }

  const temporarilyRemoveHover = () => {
    if(timeout) {
      clearTimeout(timeout);
    }
    let wrapper = document.getElementById("tabs-list");
    wrapper.classList.add("focused-tab-info-wrapper-no-hover");
    timeout = setTimeout(() => wrapper.classList.remove("focused-tab-info-wrapper-no-hover"), 2000);
  }
  const maybeFocusOnTab = async (tab, currentlyFocused) => {
    temporarilyRemoveHover();
    let title = tab.childNodes[0];
    if(!tab.style.cssText.includes("display: none") 
      && currentlyFocused && !containsFocusClass(title)) {
      const theme = (await chrome.storage.local.get("theme")).theme || "classic_mode";
      currentlyFocused.classList.remove("focused-tab-info-wrapper");
      currentlyFocused.style.backgroundColor = COLOR_SCHEMES[theme].tabWrapperColor;      
      title.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
      title.classList.add("focused-tab-info-wrapper");

      title.scrollIntoView({block: "center", behavior: "smooth"});
      return true;
    }
    return false;
  }

  let loopedCompleted = false;
  if (e.code === "ArrowDown" || (e.code === "Tab" && !e.shiftKey)) {
    let currentlyFocused = null;
    let tabList = getRenderedRows();
  
    for(let i = 0; i < tabList.length; i++) {
      let tab = tabList[i];
      if (!currentlyFocused)
        currentlyFocused = isCurrentTabFocused(tab);
      if (await maybeFocusOnTab(tab, currentlyFocused))
        break;
      // loopedCompleted avoid unwanted infinite loop
      if (i === tabList.length - 1 && !loopedCompleted) {
        loopedCompleted = true;
        i = -1;
      }
    }
  }

  if(e.code === "ArrowUp" || (e.code === "Tab" && e.shiftKey)) {
    let currentlyFocused = null;
    let tabList = getRenderedRows();
    for(let i = tabList.length - 1; i >= 0; i--) {
      let tab = tabList[i];
      if (!currentlyFocused)
        currentlyFocused = isCurrentTabFocused(tab);
      if (await maybeFocusOnTab(tab, currentlyFocused)) 
        break;
      // loopedCompleted avoid unwanted infinite loop
      if (i === 0 && !loopedCompleted) {
        loopedCompleted = true;
        i = tabList.length;
      }
    }
  }
}

const focusOnTabKeyPress = (e) => {
  if(e.code === "Enter") {
    let renderedRow = getRenderedRows();
    for(let i = renderedRow.length - 1; i >= 0; i--) {
      let row = renderedRow[i];
      let title = row.childNodes[0];
      if(containsFocusClass(title)) {
        const id = parseInt(row.getAttribute("id").split("tab_wrapper_")[1]);
        focusOnTab(id);
      }

    }
  }
}

document.getElementById("search-bar").addEventListener("input", onSearchChanged);
document.getElementById("search-bar").addEventListener("keydown", onKeyDownPressed);
document.getElementById("search-bar").addEventListener("keypress", focusOnTabKeyPress);
