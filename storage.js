import { LoadScheme } from "./popup.js";

export const setViewMode = async (viewMode) => {
  let entry = {};
  entry["viewMode"] = viewMode;
  chrome.storage.local.set(entry, function () {
    LoadScheme();
  });
};

export const getViewMode = async () => {
  let viewMode = (await chrome.storage.local.get("viewMode")).viewMode;
  if (!viewMode) {
    setViewMode("tree");
    return "tree";
  }
  return viewMode;
};

export const setSortBy = async (sortBy, scrollToTop = true) => {
  chrome.storage.local.set(
    { lastCreateTabsListContext: { sortBy, scrollToTop: scrollToTop } },
    function () {},
  );
};

export const getSortBy = async () => {
  let context = await chrome.storage.local.get("lastCreateTabsListContext");
  const sortBy = context?.lastCreateTabsListContext?.sortBy || "NONE";
  return sortBy;
};

export const getParentTabMap = async () => {
  const res = await chrome.storage.local.get("parentTabMap");
  if (!res.parentTabMap) {
    return null;
  }
  return res.parentTabMap;
};
