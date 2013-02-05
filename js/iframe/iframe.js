(function() {
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.type === "reload_images") {
        loadImages();
      }
    }
  );

  var queryStringToHash = function(str) {
      str = str || location.href;
      if (str.indexOf("?") > -1) {
          str = str.substring(str.indexOf("?") + 1);
      } else {
          return {};
      }

      var pairs = str.split("&");
      var params = {};

      var i = pairs.length;
      while (i) {
          var pair = pairs[--i].split("=");
          params[decodeURIComponent(pair[0].replace(/\+/g, " "))] = decodeURIComponent(pair[1].replace(/\+/g, " "));
      }

      return params;
  }
  
  if(queryStringToHash()["iframe"]) {
    document.body.className = document.body.className + " iframe";
  }

  $("#close_iframe").on("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"remove_iframe"}, function(response) {
      console.log(response);
    });
  }, false);
  
  $("#swap_position").on("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"swap_iframe_position"}, function(response) {
      console.log(response);
    });
  }, false);
  
  $("#pop_out").on("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"open_in_new_window"}, function(response) {
      console.log(response);
    });
  });
  
  $("#images").on("click", function(e) {
    
    var $tgt = $(e.target);
    if($tgt.is("a.delete")) {
      e.preventDefault();
      var parent = $tgt.closest("div"),
          key = $tgt.data("file_name");
          
      chrome.extension.sendMessage({type:"delete_image", key:key}, function(response) {
        parent.remove();
      });
    }
  });


  function loadImages() {
    var images = document.getElementById("images"),
    sf_promise = BUCKET.fileStore.getSortedFiles(),
    get_url_promise;
    $(images).empty();
    sf_promise.then(function(files) {
      for (var i=0; len=files.length, i<len; i++) {
        images.appendChild(newT.div(
          newT.img({src:files[i].data.file_entry.toURL()}),
          newT.a({href:"#", clss:"delete", "data-file_name":files[i].data.file_name}, "X")
        ));
      }
    }, function(e) { console.log("error", e)});
  }
  
  loadImages();
  
})();