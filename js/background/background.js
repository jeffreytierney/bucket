(function() {

  (function initContextMenu() {
    chrome.contextMenus.removeAll();
    var menu_item = chrome.contextMenus.create({
      "title": "Save image to bucket",
      "id": "save_to_bucket",
      "contexts": ["image"]
    });
    
    chrome.contextMenus.onClicked.addListener(
      function(info, tab) {
        console.log(info, tab);
        if(info.srcUrl) {
          var metadata = {
            page_url: tab.url,
            page_favicon: tab.favIconUrl,
            page_title: tab.title
          }
          BUCKET.File.newFromURI(info.srcUrl, metadata);
        }
      }
    );
  })();
  
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      if (message_listeners.hasOwnProperty(request.command)) {
        message_listeners[request.command].call(null, request, sender, sendResponse);
      }
    }
  );
  
  
  var message_listeners = {
    /*
    storeImage: function(data, mime_type) {
      BUCKET.fileStore.store(data, mime_type);
    },
    fetchImage: function(src) {
      BUCKET.fileStore.fetchAndStore(src);
    }
    */
    
  }
    
    
    

})();