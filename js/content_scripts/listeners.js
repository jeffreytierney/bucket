(function() {

  function removeEl(which) {
    if (!which) { return; }
    var el = document.getElementById(which);
    if(el) {
      el.parentNode.removeChild(el);
    }
  }
  function removeIFrame() {
    removeEl("_gh_iframe");
  }
  
  function removeLoader() {
    removeEl("_gh_loader")
  }
  
  function getImageDimensions(file_obj) {
    var img = newT.img({
      id:"gh_img", 
      src:file_obj.image_file_data_uri, 
      style:"position:absolute; top:-99999px; left:-99999px;"
    });
    
    var reportParams = function() {
      if(!img.height && !img.width) {
        setTimeout(function() {
          reportParams();
        }, 50);
        return;
      }
      
      var image_size_params = {
        type: "update_metadata",
        file_name: file_obj.image_file_name,
        update_params: {
          height: img.height,
          width: img.width
        }
      };
      
      chrome.extension.sendMessage(image_size_params, function(response) {
        chrome.extension.sendMessage({type:"image_save_complete", file_name:file_obj.image_file_name}, function(response) {
          //console.log(response);
        });
      });
    }

    document.body.appendChild(img);

    setTimeout(function() {
      reportParams();
    }, 50);

  }
  
  function showLoader() {
    if(!document.getElementById("_gh_loader")) {
      var _gh_loader = newT.div({id:"_gh_loader"},
        newT.p("Loading")
      );
      document.body.appendChild(_gh_loader);
    }
  }
  
  function showIFrame(src) {
    removeLoader();
    if(!document.getElementById("_gh_iframe")) {
      var iframe = newT.iframe({id:"_gh_iframe", src:src});
      document.body.appendChild(iframe);
    }
  }
  
  function swapIFramePosition() {
    var el = document.getElementById("_gh_iframe"),
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
      if (request.type === "get_image_dimensions") {
        getImageDimensions(request.file_obj)
      }
      if (request.type === "remove_loading") {
        removeLoader()
        return sendResponse({ok:true});
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