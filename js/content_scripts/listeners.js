(function() {

  function removeEl(which) {
    if (!which) { return; }
    var el = document.getElementById(which);
    if(el) {
      el.parentNode.removeChild(el);
    }
  }
  function removeIFrame() {
    removeEl("_bucket_iframe");
  }
  function removeLoader() {
    removeEl("_bucket_loader")
  }
  
  
  function showLoader() {
    if(!document.getElementById("_bucket_loader")) {
      var _bucket_loader = newT.div({id:"_bucket_loader"},
        newT.p("Loading")
      );
      document.body.appendChild(_bucket_loader);
    }
  }
  
  function showIFrame(src) {
    removeLoader();
    if(!document.getElementById("_bucket_iframe")) {
      var iframe = newT.iframe({id:"_bucket_iframe", src:src});
      document.body.appendChild(iframe);
    }
  }
  
  function swapIFramePosition() {
    var el = document.getElementById("_bucket_iframe"),
        classname_re = /\btop\b/i,
        new_class;
        
    if(el.className.match(classname_re)) {
       new_class= el.className.replace(classname_re, " ");
    } else {
      new_class = el.className + " top";
    }
    if("".trim) {
      new_class = new_class.trim();
    }
    el.className = new_class;
  }
  
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.type === "show_loading") {
        showLoader()
      }
      if (request.type === "remove_loading") {
        removeLoader()
      }
      if (request.type === "show_iframe") {
        showIFrame(request.src);
      }
      if (request.type === "remove_iframe") {
        removeIFrame();
      }
      if (request.type === "swap_iframe_position") {
        swapIFramePosition();
      }
    }
  );
})();