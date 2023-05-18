import { focusOnTab } from "./tab_utils.js";
import { COLOR_SCHEMES } from "./popup.js";

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

export const filterBasedOnSearchValue = (text) => {
  let value = text.toLowerCase();
  let urlList = document.getElementsByClassName("tab-wrapper");
  let firstVisibleFound = false;
  for(let i = 0; i < urlList.length; i++) {
    let url = urlList[i];
    let tabInfo = url.childNodes[0];
    let urlValue = url.childNodes[0].childNodes[1].childNodes[0].attributes[1].textContent || "";
    let titleValue = url.childNodes[0].childNodes[1].childNodes[0].innerText || "";
    urlValue = urlValue.toLowerCase();
    titleValue = titleValue.toLowerCase();
    if(value != "" && !urlValue.includes(value) && !titleValue.includes(value)) {
      url.style.cssText = url.style.cssText + "display:none !important";
      if (tabInfo.classList.contains("focused-tab-info-wrapper")) {
        tabInfo.classList.remove("focused-tab-info-wrapper");
      }
    } else {
      url.style.cssText = url.style.cssText.replace("display: none !important", "");
      if (!firstVisibleFound) {
        tabInfo.classList.add("focused-tab-info-wrapper");
        firstVisibleFound = true;
      } else if (tabInfo.classList.contains("focused-tab-info-wrapper")) {
        tabInfo.classList.remove("focused-tab-info-wrapper");
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

    if (title.classList.contains("focused-tab-info-wrapper")) {
      return title;
    }
    return null;
  }

  const maybeFocusOnTab = async (tab, currentlyFocused) => {
    let title = tab.childNodes[0];
    if(!tab.style.cssText.includes("display: none") 
      && currentlyFocused && !title.classList.contains("focused-tab-info-wrapper")) {
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
    let tabList = document.getElementsByClassName("tab-wrapper");
  
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
    let tabList = document.getElementsByClassName("tab-wrapper");
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
    let urlList = document.getElementsByClassName("tab-wrapper");
    for(let i = urlList.length - 1; i >= 0; i--) {
      let url = urlList[i];
      let title = url.childNodes[0];
      if(title.classList.contains("focused-tab-info-wrapper")) {
        const id = parseInt(url.getAttribute("id").split("tab_wrapper_")[1]);
        focusOnTab(id);
      }

    }
  }
}

document.getElementById("search-bar").addEventListener("input", onSearchChanged);
document.getElementById("search-bar").addEventListener("keydown", onKeyDownPressed);
document.getElementById("search-bar").addEventListener("keypress", focusOnTabKeyPress);
