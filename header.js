
let CURRENT_SORT_TYPE = "ACTIVE_ASC";
let DUPLICATED_TABS_MAP = {};

const closeDuplicatedTabsMenu = () => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  const duplicatedTabsMenuIcon = document.getElementById("duplicated-tabs-menu-icon");
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");

  duplicatedTabsMenuIcon.style.cssText = "";
  duplicatedTabsMenu.style.cssText = duplicatedTabsMenu.style.cssText.replace("display: block;", "");
  duplicateTabsWrapper.classList.remove("highlight-duplicated-chip-popup-open");
}

const openDuplicatedTabsMenu = () => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  const duplicatedTabsMenuIcon = document.getElementById("duplicated-tabs-menu-icon");
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");

  duplicatedTabsMenu.style.cssText = duplicatedTabsMenu.style.cssText + "display: block;"
  duplicatedTabsMenuIcon.style.cssText = "font-weight: 700 !important;";
  duplicateTabsWrapper.classList.add("highlight-duplicated-chip-popup-open");
}

// To close the popup on outside click in the menu.
document.addEventListener("click", (evt) => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");

  if (duplicatedTabsMenu.style.cssText.includes("display: block;") 
    && !duplicatedTabsMenu.contains(evt.target) && !duplicateTabsWrapper.contains(evt.target)) {
    closeDuplicatedTabsMenu();
  }    
});

const showDuplicatedTabs = () => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");

  if (!duplicatedTabsMenu.style.cssText.includes("display: block;")) {
    openDuplicatedTabsMenu();
  } else {
    closeDuplicatedTabsMenu();
  }
}

export const AreDuplicatedHighlighted = () => {
  const highlightDuplicatedItemText = document.getElementById("duplicated-tabs-text");
  return highlightDuplicatedItemText.textContent === "unhighlight duplicated";
}

const HighLightOrUnHighLightDuplicated = () => {
  const duplicatedTabsMap = DUPLICATED_TABS_MAP;
  if(AreDuplicatedHighlighted()) {
    UnhighLightDuplicatedTabs(duplicatedTabsMap);
  } else {
    HighLightDuplicatedTabs(duplicatedTabsMap);
  }
}

const UnhighLightDuplicatedTabs = (duplicatedTabsMap) => {
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");
  const highlightDuplicatedItemText = document.getElementById("duplicated-tabs-text");

  duplicateTabsWrapper.classList.remove("highlighted-duplicated-tabs");
  highlightDuplicatedItemText.textContent = "highlight duplicated";
  Object.keys(duplicatedTabsMap).forEach((url) => {
    if(duplicatedTabsMap[url].counter > 1) {
      duplicatedTabsMap[url].tabs.forEach(tab => {
        const tabInfoWrapper = document.getElementById("tab_info_wrapper_" + tab.id);
        tabInfoWrapper.style.cssText = tabInfoWrapper.style.cssText.replace("border: 3px solid rgb(0, 180, 204);", "");
      })
    }
  });
}

const HighLightDuplicatedTabs = (duplicatedTabsMap) => {
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");
  const highlightDuplicatedItemText = document.getElementById("duplicated-tabs-text");

  duplicateTabsWrapper.classList.add("highlighted-duplicated-tabs");
  highlightDuplicatedItemText.textContent = "unhighlight duplicated";

  Object.keys(duplicatedTabsMap).forEach((url) => {
    if(duplicatedTabsMap[url].counter > 1) {
      duplicatedTabsMap[url].tabs.forEach(tab => {
        const tabInfoWrapper = document.getElementById("tab_info_wrapper_" + tab.id);
        tabInfoWrapper.style.cssText += "border: 3px solid rgb(0, 180, 204);";
      })
    }
  });
}

export const MaybeHighlightTabs = (duplicatedTabsMap) => {
  if(AreDuplicatedHighlighted()) {
    HighLightDuplicatedTabs(duplicatedTabsMap);
  }
}

const RemoveDuplicated = (e) => {
  const duplicatedTabsMap = DUPLICATED_TABS_MAP;
  const callback = e.currentTarget.callback;
  const sortBy = e.currentTarget.sortBy;

  let ids = [];
  let hasActive = false;
  Object.keys(duplicatedTabsMap).forEach((url) => {
    if(duplicatedTabsMap[url].counter > 1) {
      duplicatedTabsMap[url].tabs.forEach((tab, i) => {
        if(!tab.active) {
          ids.push(tab.id);
        } else {
          hasActive = true;
        }
      })
      if(!hasActive) {
        ids.pop();
      }
    }
  });
  callback(ids, sortBy);
}

const getDuplicatedTabs = (tabs) => {
  let duplicatedTabsMap = {}
  for(let i = 0; i < tabs.length; i++) {
    if(!duplicatedTabsMap[tabs[i].url]) {
      duplicatedTabsMap[tabs[i].url] = {
        tabs: [tabs[i]],
        counter: 1,
      }
    } else {
      duplicatedTabsMap[tabs[i].url].counter = duplicatedTabsMap[tabs[i].url].counter + 1;
      duplicatedTabsMap[tabs[i].url].tabs.push(tabs[i]);
    }
  }
  return duplicatedTabsMap;
}

const ThemeModelElement = async () => {
  const toogleThemeIcon = document.getElementById("toggle_theme_icon");
  toogleThemeIcon.addEventListener('click', async () => {
    const upToDateMode = (await chrome.storage.local.get("theme")).theme || "classic_mode";
    let entry = {}
    entry["theme"] = upToDateMode === "classic_mode" ? "dark_mode" : "classic_mode";
    chrome.storage.local.set(entry, function() {
    });
  });
}
export const ShowChipsIfNeeded = (tabs) => {
  const duplicatedTabsMap = getDuplicatedTabs(tabs);
  let duplicatesCounter = 0;

  Object.keys(duplicatedTabsMap).forEach((url) => {
    if(duplicatedTabsMap[url].counter > 1) {
      duplicatesCounter += duplicatedTabsMap[url].counter;
    }
  });
  const duplicateTabsCounter = document.getElementById("duplicated-tabs-counter");
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");

  if (duplicatesCounter > 0) {
    duplicateTabsWrapper.style.cssText += " display: flex;";
    duplicateTabsCounter.textContent = duplicatesCounter.toString();    
  } else {
    duplicateTabsWrapper.style.cssText += " display: none;";
  }
  
  if(tabs.length > 0) {
    const openTabsWrapper = document.getElementById("open-tabs-wrapper");
    const openTabsCounter = document.getElementById("open-tabs-counter");

    openTabsWrapper.style.cssText += " display: flex;";
    openTabsCounter.textContent = (tabs.length).toString(); 
  }
}

export const CreateHeader = (tabs, onSortedButtonClicked, onRemoveDuplicates) => {
    let wrapper = document.getElementById("header");
    DUPLICATED_TABS_MAP = getDuplicatedTabs(tabs);

    if(wrapper.children.length === 0) {
      const header = document.createElement('div');
      header.className = "header-child";
      const leftElementsHeader = document.createElement('div');
      leftElementsHeader.className = "left-elements-wrapper";
      // Site
      const siteHeaderWrapper = document.createElement('div');
      siteHeaderWrapper.className = "header-element";
      const siteHeader = document.createElement('span');
      siteHeader.setAttribute("id", "siteHeader");
      siteHeader.className = "header-button"
      const sortIconsite = document.createElement('span');
      sortIconsite.textContent = "sort";
      sortIconsite.className = "material-icons sortIcon"
      sortIconsite.style.cssText = "margin-left: 0px;";
      siteHeaderWrapper.appendChild(siteHeader);
      siteHeaderWrapper.appendChild(sortIconsite);
      siteHeaderWrapper.addEventListener('click', async () => {
          if (CURRENT_SORT_TYPE == "SITE_ASC") 
            CURRENT_SORT_TYPE = "SITE_DESC";
          else CURRENT_SORT_TYPE = "SITE_ASC";
          await onSortedButtonClicked(CURRENT_SORT_TYPE);
      });

      // Title
      const titleHeaderWrapper = document.createElement('div');
      titleHeaderWrapper.className = "header-element title-header-wrapper";
      const titleHeader = document.createElement('span');
      titleHeader.setAttribute("id", "siteHeader");
      titleHeader.className = "header-button"
      titleHeader.textContent = "Title";
      const sortIconTitle = document.createElement('span');
      sortIconTitle.textContent = "sort";
      sortIconTitle.className = "material-icons sortIcon"
      titleHeaderWrapper.appendChild(titleHeader);
      titleHeaderWrapper.appendChild(sortIconTitle);
      titleHeaderWrapper.addEventListener('click', async () => {
          if (CURRENT_SORT_TYPE == "TITLE_ASC") 
            CURRENT_SORT_TYPE = "TITLE_DESC";
          else CURRENT_SORT_TYPE = "TITLE_ASC";
          await onSortedButtonClicked(CURRENT_SORT_TYPE);
      });

      const chipsHeaderWrapper = document.createElement('div');
      chipsHeaderWrapper.className = "chips-header-wrapper";
    
      // duplicated tabs
      const duplicatedTabsHeaderWrapper = document.createElement('div');
      duplicatedTabsHeaderWrapper.setAttribute("id", "duplicated-tabs-wrapper");
      duplicatedTabsHeaderWrapper.className = "info-chip duplicated-tabs-wrapper";
      const duplicatedTablsHeader = document.createElement('span');
      duplicatedTablsHeader.className = "info-chip-text"
      duplicatedTablsHeader.textContent = "duplicated";
      duplicatedTabsHeaderWrapper.appendChild(duplicatedTablsHeader);
      const duplicatedTabsCounter = document.createElement('div');
      duplicatedTabsCounter.className = "chips-left-circle";
      const duplicatedCountText = document.createElement('span');
      duplicatedCountText.setAttribute("id", "duplicated-tabs-counter");
      duplicatedCountText.className = "chips-left-circle-text"
      duplicatedTabsCounter.appendChild(duplicatedCountText);
      duplicatedTabsHeaderWrapper.appendChild(duplicatedTabsCounter)

      const duplicatedTabsMenuIcon = document.createElement('span');
      duplicatedTabsMenuIcon.setAttribute("id", "duplicated-tabs-menu-icon");
      duplicatedTabsMenuIcon.textContent = "more_vert";
      duplicatedTabsMenuIcon.className = "material-icons popup-menu-icon"
      duplicatedTabsHeaderWrapper.appendChild(duplicatedTabsMenuIcon);
      duplicatedTabsHeaderWrapper.addEventListener('click', showDuplicatedTabs);
    
      const duplicatedTabsMenu = document.createElement('div');
      duplicatedTabsMenu.className = "popup-menu";
      duplicatedTabsMenu.setAttribute("id", "duplicated-tabs-menu");

      const highlightDuplicatedItem = document.createElement('div');
      highlightDuplicatedItem.className = "popup-menu-item";
      highlightDuplicatedItem.addEventListener('click', HighLightOrUnHighLightDuplicated);

      const highlightDuplicatedItemText = document.createElement('span');
      highlightDuplicatedItemText.setAttribute("id", "duplicated-tabs-text");
      highlightDuplicatedItemText.className = "popup-menu-item-text";
      highlightDuplicatedItemText.textContent = "highlight duplicated";

      highlightDuplicatedItem.appendChild(highlightDuplicatedItemText);

      const removeDuplicatedItem = document.createElement('div');
      removeDuplicatedItem.className = "popup-menu-item";
      removeDuplicatedItem.addEventListener('click', RemoveDuplicated);
      removeDuplicatedItem.sortBy = CURRENT_SORT_TYPE;
      removeDuplicatedItem.callback = onRemoveDuplicates;

      const removeDuplicatedItemText = document.createElement('span');
      removeDuplicatedItemText.className = "popup-menu-item-text";
      removeDuplicatedItemText.textContent = "remove duplicated";
      
      removeDuplicatedItem.appendChild(removeDuplicatedItemText);

      duplicatedTabsMenu.appendChild(highlightDuplicatedItem);
      duplicatedTabsMenu.appendChild(removeDuplicatedItem);
      duplicatedTabsHeaderWrapper.appendChild(duplicatedTabsMenu);
      
      chipsHeaderWrapper.appendChild(duplicatedTabsHeaderWrapper);

      // Active
      const activeHeaderWrapper = document.createElement('div');
      activeHeaderWrapper.className = "header-element";
      const activeHeader = document.createElement('span');
      activeHeader.setAttribute("id", "siteHeader");
      activeHeader.className = "header-button";
      activeHeader.textContent = "Active";
      const sortIconActive = document.createElement('span')
      sortIconActive.textContent = "sort";
      sortIconActive.className = "material-icons sortIcon"
      activeHeaderWrapper.style.cssText = 'width:15%; justify-content: end; align-items: center; cursor:pointer';
      activeHeaderWrapper.appendChild(activeHeader);
      activeHeaderWrapper.appendChild(sortIconActive);
      activeHeaderWrapper.addEventListener('click', async () => {
          if (CURRENT_SORT_TYPE == "ACTIVE_ASC") 
            CURRENT_SORT_TYPE = "ACTIVE_DESC";
          else CURRENT_SORT_TYPE = "ACTIVE_ASC";
          await onSortedButtonClicked(CURRENT_SORT_TYPE);
      });
      leftElementsHeader.appendChild(siteHeaderWrapper);
      leftElementsHeader.appendChild(titleHeaderWrapper);

      header.appendChild(leftElementsHeader);
      header.appendChild(chipsHeaderWrapper);
      header.appendChild(activeHeaderWrapper);

      wrapper.appendChild(header);
    }
    ShowChipsIfNeeded(tabs);
    MaybeHighlightTabs(DUPLICATED_TABS_MAP);
    ThemeModelElement();
}
  