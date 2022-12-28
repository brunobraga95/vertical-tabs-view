
let CURRENT_SORT_TYPE = "ACTIVE_ASC";

const showDuplicatedTabs = () => {
  const duplicatedTabsMenu = document.getElementById("duplicated-tabs-menu");
  const duplicatedTabsMenuIcon = document.getElementById("duplicated-tabs-menu-icon");

  if (!duplicatedTabsMenu.style.cssText.includes("display: block;")) {
    duplicatedTabsMenu.style.cssText = duplicatedTabsMenu.style.cssText + "display: block;"
    duplicatedTabsMenuIcon.style.cssText = "font-weight: 700 !important;";
  } else {
    duplicatedTabsMenuIcon.style.cssText = "";
    duplicatedTabsMenu.style.cssText = duplicatedTabsMenu.style.cssText.replace("display: block;", "");
  }
}

const HighLightDuplicated = (e) => {
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");
  const highlightDuplicatedItemText = document.getElementById("duplicated-tabs-text");

  if(duplicateTabsWrapper.style.cssText.includes("border: 3px solid rgb(0, 180, 204);")) {
    duplicateTabsWrapper.style.cssText = duplicateTabsWrapper.style.cssText.replace("border: 3px solid rgb(0, 180, 204);", "");
    duplicateTabsWrapper.style.cssText = duplicateTabsWrapper.style.cssText.replace("top: -3px;", "");
    highlightDuplicatedItemText.textContent = "highlight duplicated";
  } else {
    duplicateTabsWrapper.style.cssText += "border: 3px solid rgb(0, 180, 204);top: -3px";
    highlightDuplicatedItemText.textContent = "unhighlight duplicated";
  }

  const duplicatedTabsMap = e.currentTarget.duplicatedTabsMap;
  HighLightDuplicatedTabs(duplicatedTabsMap);
}

const HighLightDuplicatedTabs = (duplicatedTabsMap) => {
  Object.keys(duplicatedTabsMap).forEach((url) => {
    if(duplicatedTabsMap[url].counter > 1) {
      duplicatedTabsMap[url].tabs.forEach(tab => {
        const tabInfoWrapper = document.getElementById("tab_info_wrapper_" + tab.id);
        if(tabInfoWrapper.style.cssText.includes("border: 3px solid rgb(0, 180, 204);")) {
          tabInfoWrapper.style.cssText = tabInfoWrapper.style.cssText.replace("border: 3px solid rgb(0, 180, 204);", "");
        } else {
          tabInfoWrapper.style.cssText += "border: 3px solid rgb(0, 180, 204);";
        }
      })
    }
  });
}

const MaybeHighlightTabs = (duplicatedTabsMap) => {
  const duplicateTabsWrapper = document.getElementById("duplicated-tabs-wrapper");
  if(duplicateTabsWrapper.style.cssText.includes("border: 3px solid rgb(0, 180, 204);")) {
    HighLightDuplicatedTabs(duplicatedTabsMap);
  }
}

const RemoveDuplicated = (e) => {
  const duplicatedTabsMap = e.currentTarget.duplicatedTabsMap;
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
    }
  });
  if(!hasActive) {
    ids.shift();
  }
  callback(ids, sortBy);
}

function maybeRemoveURLParameter(url) {
  const exceptions_list = ["https://www.google.com/search"];
  if(exceptions_list.includes(url.split("?")[0])) {
    return url;
  }
  return url.split("?")[0];
}

const getDuplicatedTabs = (tabs) => {
  let duplicatedTabsMap = {}
  for(let i = 0; i < tabs.length; i++) {
    const urlWithoutParams = maybeRemoveURLParameter(tabs[i].url);
    if(!duplicatedTabsMap[urlWithoutParams]) {
      duplicatedTabsMap[urlWithoutParams] = {
        tabs: [tabs[i]],
        counter: 1,
      }
    } else {
      duplicatedTabsMap[urlWithoutParams].counter = duplicatedTabsMap[urlWithoutParams].counter + 1;
      duplicatedTabsMap[urlWithoutParams].tabs.push(tabs[i]);
    }
  }
  return duplicatedTabsMap;
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

export const CreateHeader =  (tabs, onSortedButtonClicked, onRemoveDuplicates) => {
    let wrapper = document.getElementById("header");
    if(wrapper.children.length === 0) {
      const duplicatedTabsMap = getDuplicatedTabs(tabs);
      const header = document.createElement('div');
      header.style.cssText = "width: calc(95% - 30px); display: flex; justify-content:space-between; padding: 10px 15px";

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
          MaybeHighlightTabs(duplicatedTabsMap);
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
          MaybeHighlightTabs(duplicatedTabsMap);
      });

      const chipsHeaderWrapper = document.createElement('div');
      chipsHeaderWrapper.className = "chips-header-wrapper";
    
      // duplicated tabs
      const duplicatedTabsHeaderWrapper = document.createElement('div');
      duplicatedTabsHeaderWrapper.setAttribute("id", "duplicated-tabs-wrapper");
      duplicatedTabsHeaderWrapper.className = "info-chip";
      const duplicatedTablsHeader = document.createElement('span');
      duplicatedTablsHeader.className = "info-chip-text"
      duplicatedTablsHeader.textContent = "duplicated tabs";
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
      duplicatedTabsMenuIcon.className = "material-icons duplicated-tabs-menu-icon"
      duplicatedTabsHeaderWrapper.appendChild(duplicatedTabsMenuIcon);
      duplicatedTabsMenuIcon.addEventListener('click', showDuplicatedTabs);
    
      const duplicatedTabsMenu = document.createElement('div');
      duplicatedTabsMenu.className = "duplicated-tabs-menu";
      duplicatedTabsMenu.setAttribute("id", "duplicated-tabs-menu");

      const highlightDuplicatedItem = document.createElement('div');
      highlightDuplicatedItem.className = "duplicated-tabs-menu-item";
      highlightDuplicatedItem.addEventListener('click', HighLightDuplicated);
      highlightDuplicatedItem.duplicatedTabsMap = duplicatedTabsMap;

      const highlightDuplicatedItemText = document.createElement('span');
      highlightDuplicatedItemText.setAttribute("id", "duplicated-tabs-text");
      highlightDuplicatedItemText.className = "duplicated-tabs-menu-item-text";
      highlightDuplicatedItemText.textContent = "highlight duplicated";

      highlightDuplicatedItem.appendChild(highlightDuplicatedItemText);

      const removeDuplicatedItem = document.createElement('div');
      removeDuplicatedItem.className = "duplicated-tabs-menu-item";
      removeDuplicatedItem.addEventListener('click', RemoveDuplicated);
      removeDuplicatedItem.duplicatedTabsMap = duplicatedTabsMap;
      removeDuplicatedItem.sortBy = CURRENT_SORT_TYPE;
      removeDuplicatedItem.callback = onRemoveDuplicates;

      const removeDuplicatedItemText = document.createElement('span');
      removeDuplicatedItemText.className = "duplicated-tabs-menu-item-text";
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
          MaybeHighlightTabs(duplicatedTabsMap);
      });
      leftElementsHeader.appendChild(siteHeaderWrapper);
      leftElementsHeader.appendChild(titleHeaderWrapper);

      header.appendChild(leftElementsHeader);
      header.appendChild(chipsHeaderWrapper);
      header.appendChild(activeHeaderWrapper);

      wrapper.appendChild(header);
    }
    ShowChipsIfNeeded(tabs);
}
  