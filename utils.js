export const getParentTabMap = async () => {
    const res = await chrome.storage.local.get("parentTabMap");
    if(!res.parentTabMap) {
      return { parentTabMap: {} }
    }
    return res;
  }
