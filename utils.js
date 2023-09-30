export const getRenderedRows = () => document.getElementsByClassName("tab-wrapper");

export const getCurrentTheme = () => chrome.storage.local.get("theme").theme || "classic_mode";

export const removeFocusClass = (tab) => tab.classList.remove("focused-tab-info-wrapper");

export const containsFocusClass = (tab) => tab.classList.contains("focused-tab-info-wrapper");

export const removeFocusStyleFromTabInfo = (tab) => tab.classList.remove("focused-tab-info-wrapper");

export const getTabById = (id) => document.getElementById("tab_info_wrapper_" + id); 

export const getParentTabMap = async () => {
  const res = await chrome.storage.local.get("parentTabMap");
  if(!res.parentTabMap) {
    return { parentTabMap: {} }
  }
  return res;
}