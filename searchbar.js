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

const onSearchChanged = debounce((e) => {
    let value = e.target.value.toLowerCase();
    let urlList = document.getElementsByClassName("tab-wrapper");
    for(let i = 0; i < urlList.length; i++) {
      let url = urlList[i];
      let urlValue = url.childNodes[0].childNodes[1].childNodes[0].attributes[2].textContent || "";
      let titleValue = url.childNodes[0].childNodes[1].childNodes[0].innerText || "";
      urlValue = urlValue.toLowerCase();
      titleValue = titleValue.toLowerCase();
      if(value != "" && !urlValue.includes(value) && !titleValue.includes(value)) {
        url.style.cssText = url.style.cssText + "display:none";
      } else {
        url.style.cssText = url.style.cssText + "display:flex";
      }
    }
}, 300);

const onKeyDownPressed = (e) => {
  if(e.code === "ArrowDown") {
    let urlList = document.getElementsByClassName("tab-wrapper");
    for(let i = 0; i < urlList.length; i++) {
      let url = urlList[i];
      let title = url.childNodes[0];
      if(!url.style.cssText.includes("display: none")) {
        title.focus();
        break;
      }
    }
  }
}
document.getElementById("search-bar").addEventListener("input", onSearchChanged);
document.getElementById("search-bar").addEventListener("keydown", onKeyDownPressed);