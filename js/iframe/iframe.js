(function() {
  
  chrome.runtime.getBackgroundPage(function(bg) { 
    BUCKET.bg_page = bg; 
    loadImages();
  });
  
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.type === "reload_images") {
        loadImages();
      }
      if (request.type === "open_save_form") {
        BUCKET.util.showEditForm(request.key);
      }

    }
  );
  
  (function() { 
    var t; 
    $(window).bind("resize", function(e) { 
      clearTimeout(t); 
      t = setTimeout(function() {
      chrome.extension.sendMessage({
        type:"save_window_dimensions",
        dims: {
          height: $(this).height(), 
          width: $(this).width()
        }
      }, function(response) {
        console.log(response);
      });

      }, 500)  
    }) 
  })();
  
/*
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
*/

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
      var $parent = $tgt.closest("div"),
          key = $parent.data("file_name");
          
      chrome.extension.sendMessage({type:"delete_image", key:key}, function(response) {
        $parent.remove();
      });
    } else if ($tgt.is("a.edit")) {
      e.preventDefault();
      var $parent = $tgt.closest("div"),
          key = $parent.data("file_name");

      BUCKET.util.showEditForm(key);    
    }
  });


  function loadImages() {
    var images = document.getElementById("images"),
    sf_promise = BUCKET.bg_page.BUCKET.fileStore.getSortedFiles(),
    get_url_promise;
    $(images).empty();
    sf_promise.then(function(files) {
      for (var i=0; len=files.length, i<len; i++) {
        images.appendChild(newT.render("image_item.bucket", files[i]));
      }
    }, function(e) { console.log("error", e)});
  }
  
  newT.save("image_item.bucket", function(file) {
    var md = file.data.metadata;
    return (
      newT.div({id:file.data.file_name.split(".")[0], "data-file_name":file.data.file_name},
        newT.img({src:file.data.file_entry.toURL()}),
        (md.get("title") ? 
          newT.strong({clss:"title"}, md.get("title")) : 
          newT.a({href:md.get("original_url"), target:"_blank", clss:"url", title:md.get("original_url")}, md.get("original_url").replace(/https?\:\/\//, ""))
        ),
        (md.get("notes") ? newT.p(md.get("notes")) : ""),
        (md.get("title") ? newT.a({href:md.get("original_url"), target:"_blank", clss:"url", title:md.get("original_url")}, md.get("original_url").replace(/https?\:\/\//, "")) : ""),
        newT.a({href:"#", clss:"edit"}, "Edit"),
        newT.a({href:"#", clss:"delete"}, "X")
      )
    );
  });
  
  BUCKET.util.reloadImage = function(key) {
    var file = BUCKET.bg_page.BUCKET.File.load(key);
    file.loaded.then(function() { // success
      $("#"+key.split(".")[0]).replaceWith(newT.render("image_item.bucket", file))
    });
  }
  
  
  
})();