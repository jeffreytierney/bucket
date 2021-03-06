(function() {

  var extension_window,
      extension_tab;

  chrome.contextMenus.removeAll();
  var menu_item = chrome.contextMenus.create({
    "title": "Save image to GifHorse",
    "id": "save_to_gifhorse",
    "contexts": ["image"]
  });
  
  

  chrome.browserAction.onClicked.addListener(
    function(tab) {
      openInNewWindow();
    }
  );
  
  chrome.windows.onRemoved.addListener(function(window_id) {
    if(extension_window && window_id === extension_window.id) {
      extension_window = null;
      extension_tab = null;          
    }
  });
  
  
  chrome.contextMenus.onClicked.addListener(
    function(info, tab) {
      if(info.srcUrl) {
        var metadata = {
          page_url: tab.url,
          page_favicon: tab.favIconUrl,
          page_title: tab.title
        }
        showLoader();
        var file = GH.File.newFromURI(info.srcUrl, metadata);
        file.loaded.then(function() { // success
          file.readAsDataUrl().then(function(data_uri) {       
            getFileDimensions({
              image_file_name: file.data.file_name,
              image_file_data_uri: data_uri
            })
          });

        }, function() { // error
          //console.log("error");
          removeLoader();

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
          removeLoader(function() {
            openInNewWindow(request.file_name);
          });
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
      if (request.type === "delete_image") {
        deleteImage(request.key, sendResponse);
        return true;
      }
      if (request.type === "save_window_dimensions") {
        saveWindowDimensions(request.dims);
        return true;
      }
    });
    
  // actions
    
  function updateMetaData(file_name, update_params, sendResponse) {
    GH.fileStore.getFileMetadata(file_name).then(function(metadata) {
      //console.log(update_params, metadata);
      var file_metadata = new GH.FileMetadata(metadata);
      for(var param in update_params) {
        file_metadata.set(param, update_params[param]);
      }
      GH.fileStore.updateFileMetadata(file_name, file_metadata.toJSON()).then(function() {
        sendResponse({ok:true});
      });
    }, function(e) {
      //console.log(e);
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
      //console.log(response);
    });
  }
  
  function openInNewWindow(saved_image) {
    removeIFrame();
    if(extension_window && extension_tab) {
      chrome.tabs.sendMessage(extension_tab.id, {type: "reload_images"}, function(response) {
        //console.log(response);
      });
      chrome.windows.update(extension_window.id, {focused:true}, function () {})
      if(saved_image) {
        openSaveForm(extension_tab, saved_image);
      }
    } else {
      var window_params = getWindowDimensions();
      window_params.url = chrome.extension.getURL("/html/images.html");
      window_params.type = "popup";
      chrome.windows.create(window_params, function(window) {
        extension_window = window;
        extension_tab = window.tabs[0];
        if(saved_image) {
        setTimeout(function() {
          openSaveForm(extension_tab, saved_image);
        }, 250);
      }
      });
    }
  }
  
  function openSaveForm(tab, key) {
    chrome.tabs.sendMessage(tab.id, {type:"open_save_form", key:key}, function(response) {
      //console.log(response);
    });
  }
  
  function removeIFrame() {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "remove_iframe"}, function(response) {
        //console.log(response);
      });
    });
  }
  function showLoader() {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "show_loading"}, function(response) {
        //console.log(response);
      });
    });
  }
  
  function removeLoader(cb) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "remove_loading"}, function(response) {
        if(cb && typeof cb === "function") {
          cb.call();
        }
        //console.log(response);
      });
    });
  }
  
  function swapIFramePosition() {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "swap_iframe_position"}, function(response) {
        //console.log(response);
      });
    });
  }
  
  function getFileDimensions(obj) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {type: "get_image_dimensions", file_obj:obj}, function(response) {
        //console.log(response);
      });
    });
  }
  
  function deleteImage(key, sendResponse) {
    GH.fileStore.remove(key).then(function() {
      sendResponse({removed: key});
    })
  }
  
  function saveWindowDimensions(dims) {
    var settings = JSON.parse(localStorage.getItem("settings") || "{}");
    settings.window_dims = dims || {};
    localStorage.setItem("settings", JSON.stringify(settings));
  }
  
  function getWindowDimensions() {
    var settings = JSON.parse(localStorage.getItem("settings") || "{}");
    return settings.window_dims || {};

  }
  
  function checkDataIntegrity() {
    GH.FileDataIntegrity.checkAll();
  }
  
  
  checkDataIntegrity();


})();