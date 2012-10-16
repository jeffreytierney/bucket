(function() {
  var regex = {
    data_uri: /data\:\s*([^;]+);\s*base64\,(.+)/i
  };
  
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
          var matches = info.srcUrl.match(regex.data_uri);
          if (matches) {
            var mime_type = matches[1],
                data = atob(matches[2]);
                
            //console.log(data.length, data)

            var ab = new Uint8Array(data.length);
            for (var i = 0; i < data.length; i++) {
                ab[i] = data.charCodeAt(i) & 0xff;
            }
            
            message_listeners.storeImage(ab, mime_type);
          } else {
            message_listeners.fetchImage(info.srcUrl);
          }
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
    
    storeImage: function(data, mime_type) {
      
      BUCKET.fileStore.store(data, mime_type);
    },
    fetchImage: function(src) {
      BUCKET.fileStore.fetchAndStore(src);
    }
    
    
  }
    
    
    

})();