(function() {

  chrome.contextMenus.removeAll();
  var menu_item = chrome.contextMenus.create({
    "title": "Save image to bucket",
    "id": "save_to_bucket",
    "contexts": ["image"]
  });
  
  

  chrome.browserAction.onClicked.addListener(
    function(tab) {
      showIFrame(tab);
    }
  );
  
  
  /*
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.type === "iframe_loaded") {
        getAndSendImages()
        return true;
      }
    });

  

  function getAndSendImages() {

      var lk_promise = BUCKET.fileStore.listKeys(true),
          images = [];
      
      
      lk_promise.then(function(keys) { 
        console.log(keys);
        for (var i=0; len=keys.length, i<len; i++) { 

          BUCKET.File.load(keys[i].name).loaded.then(function(bFile) {
            bFile.readAsDataUrl().then(function(data_url) {
              images.push(data_url);
              if(images.length === keys.length) {
                chrome.tabs.getSelected(null, function(tab) {
                  sendImages(images, tab);
                });
              }
            })
          }, function(e) { console.log("error", e)})
      
        }
      });
    }
  
  function sendImages(images, tab) {
    console.log(tab)
    chrome.tabs.sendMessage(tab.id, {type: "show_images", images:images}, function(response) {
      console.log(response);
    });
  }
*/
  
  chrome.contextMenus.onClicked.addListener(
    function(info, tab) {
      if(info.srcUrl) {
        var metadata = {
          page_url: tab.url,
          page_favicon: tab.favIconUrl,
          page_title: tab.title
        }
        showLoader();
        var file = BUCKET.File.newFromURI(info.srcUrl, metadata);
        file.loaded.then(function() { // success
          file.readAsDataUrl().then(function(data_uri) {       
            getFileDimensions({
              image_file_name: file.data.file_name,
              image_file_data_uri: data_uri
            })
          });
          /*
          file.readAsDataUrl().then(function(data_uri) {              
            chrome.tabs.getSelected(null, function(tab) {
              var file_data = {
                image_status: "success", 
                image_data_uri:data_uri,
                image_file_name: file.data.file_name
              }
              chrome.tabs.sendMessage(tab.id, file_data, function(response) {
                console.log(response);
              });
            })
          });
          */
        }, function() { // error
          console.log("error");
          removeLoader();
          /*
          chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendMessage(tab.id, {image_status: "failure"}, function(response) {
              console.log(response.status);
            });
          });
          */
        });
      }
    }
  ); 
  
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.type === "update_metadata") {
        updateMetaData(request.file_name, request.update_params, sendResponse)
        return true;
      }
      if(request.type === "image_save_complete") {
        chrome.tabs.getSelected(null, function(tab) {
          showIFrame(tab, request.file_name);
        });
      }
      if (request.type === "remove_iframe") {
        removeIFrame();
        return true;
      }
      if (request.type === "open_in_new_window") {
        openInNewWindow();
        return true;
      }
      if (request.type === "swap_iframe_position") {
        swapIFramePosition();
        return true;
      }
      
    });
    
  // actions
    
  function updateMetaData(file_name, update_params, sendResponse) {
    BUCKET.fileStore.getFileMetadata(file_name).then(function(metadata) {
      var file_metadata = new BUCKET.FileMetadata(metadata);
      for(var param in update_params) {
        file_metadata.set(param, update_params[param]);
      }
      BUCKET.fileStore.updateFileMetadata(file_name, file_metadata.toJSON()).then(function() {
        sendResponse({ok:true});
      });
    }, function(e) {
      console.log(e);
      sendResponse({ok:false});
    });

  }
  
  function showIFrame(tab, saved_image) {
    var params = {
        type: "show_iframe", 
        src:chrome.extension.getURL("/html/images.html?iframe=true")
      };
      
    if(saved_image) {
      params.saved_image = saved_image;
    }
    chrome.tabs.sendMessage(tab.id, params, function(response) {
      console.log(response);
    });
  }
  
  function openInNewWindow() {
    removeIFrame();
    chrome.windows.create({'url': chrome.extension.getURL("/html/images.html")}, function(window) {});
  }
  
  function removeIFrame() {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "remove_iframe"}, function(response) {
        console.log(response);
      });
    });
  }
  function showLoader() {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "show_loading"}, function(response) {
        console.log(response);
      });
    });
  }
  
  function removeLoader() {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "remove_loading"}, function(response) {
        console.log(response);
      });
    });
  }
  
  function swapIFramePosition() {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "swap_iframe_position"}, function(response) {
        console.log(response);
      });
    });
  }
  
  function getFileDimensions(obj) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "get_image_dimensions", file_obj:obj}, function(response) {
        console.log(response);
      });
    });
  }

})();