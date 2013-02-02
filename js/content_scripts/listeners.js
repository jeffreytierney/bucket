(function() {
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.type === "show_iframe") {
        var iframe = newT.iframe({src:request.src});
        document.body.appendChild(iframe);
      }
    }
  );
})();