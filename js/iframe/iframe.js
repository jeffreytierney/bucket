(function() {
  
  chrome.runtime.getBackgroundPage(function(bg) { 
    BUCKET.bg_page = bg;
    BUCKET.files = new BUCKET.bg_page.BUCKET.FileGroup();
    BUCKET.files.setOnFilter(function(bf) {
      showAndHide(bf);
    });
    loadImages();
    $("#q").focus();
  });
  
  var timers = {
        show: null,
        hide: null,
        show_hide: null
      }, 
      file_visibility = {};
  
  function showAndHide(bf) {
    clearTimeout(timers.show_hide);
    clearTimeout(timers.show);
    clearTimeout(timers.hide);
    
    timers.show_hide = setTimeout(function() {
      toggle("show", bf.display_files);
      toggle("hide", bf.hidden_files);
    });
    
    var chunk_size = 20;
    
    function toggle(type, files, i) {
      i = i || 0;
      var end = Math.min(i+chunk_size, files.length),
          class_method = (type==="show" ? "removeClass" : "addClass");
      while(i<end) {
        var file = files[i],
          key = file.getKey();
        if(file_visibility[key] != type) {        
          $(document.getElementById(key))[class_method]("is-hidden");
        }
        file_visibility[key] = type;
        i++;
      }
      if (i < files.length-1) { 
        timers[type] = setTimeout(function() { toggle(type, files, i); });
      }
    }

  }
  
  
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
        //console.log(response);
      });

      }, 500)  
    }) 
  })();
  
  
  var $drop_zone = $("#drop_zone");
  
  document.body.addEventListener("dragenter", function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy"
    if(e.dataTransfer.types && e.dataTransfer.types.length && e.dataTransfer.types.indexOf("Files") > -1) {
      $drop_zone.addClass("is-dragging");
    }
  }, false);
  
  document.getElementById("drop_zone").addEventListener("dragleave", function(e) {
    e.stopPropagation();
    e.preventDefault();
    $drop_zone.removeClass("is-dragging");
  }, false);
  
  document.getElementById("drop_zone").addEventListener("dragover", function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, false);


  
  document.getElementById("drop_zone").addEventListener("drop", function(e) {
    e.stopPropagation();
    e.preventDefault();
    $drop_zone.removeClass("is-dragging");
    var files = e.dataTransfer.files;
    for(var i=0, len = files.length; i<len; i++) {
      BUCKET.bg_page.BUCKET.File.newFromFileUpload(files[i]).loaded.then(function(bf) {
        updateImageDimensions(bf).then(function() {
          loadImages();
          if(len === 1) {
            BUCKET.util.showEditForm(bf.data.file_name);
          }
        });
      }, function(e) {
        alert(e);
      });
    }
    
  }, false);

  $("#close_iframe").on("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"remove_iframe"}, function(response) {
      //console.log(response);
    });
  }, false);
  
  $("#swap_position").on("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"swap_iframe_position"}, function(response) {
      //console.log(response);
    });
  }, false);
  
  $("#pop_out").on("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"open_in_new_window"}, function(response) {
      //console.log(response);
    });
  });
  
  var Form = {
    els: {
      search_form: $("#search_form"),
      q: $("#q"),
      q_clear: $("#q_clear")
    },
    is_empty: true
  }
  
  Form.els.search_form.on("submit", function(e) {
    e.preventDefault();
  });
  
  Form.els.q.on("input", function(e) {
    BUCKET.files.filter(this.value);
    if(this.value && Form.is_empty) {
      Form.is_empty = false;
      Form.els.search_form.removeClass("is-empty");
    }
    else if(!this.value && !Form.is_empty){
      Form.is_empty = true;
      Form.els.search_form.addClass("is-empty"); 
    }
  });
  
  Form.els.q_clear.on("click", function(e) {
    e.preventDefault();
    Form.is_empty = true;
    Form.els.search_form.addClass("is-empty");
    Form.els.q.val("");
    BUCKET.files.clearFilter();
  });
  
  $("#images").on("click", function(e) {
    
    var $tgt = $(e.target);
    if($tgt.is("a.delete")) {
      e.preventDefault();
      e.stopPropagation();
      var $parent = $tgt.closest("div"),
          key = $parent.data("file_name");
          
      chrome.extension.sendMessage({type:"delete_image", key:key}, function(response) {
        $parent.remove();
      });
    } else if ($tgt.is("a.edit")) {
      e.preventDefault();
      e.stopPropagation();
      var $parent = $tgt.closest("div"),
          key = $parent.data("file_name");

      BUCKET.util.showEditForm(key);    
    } else if ($tgt.is("img")) {
      e.preventDefault();
      e.stopPropagation();
      var $parent = $tgt.closest("div"),
          key = $parent.data("file_name");

      BUCKET.util.showFullSize(key);    
    }
  });
  
  function loadImages() {
    var dfr = new RSVP.Promise();
    BUCKET.files.loadAll().then(function() {
      BUCKET.files.filter().then(function(bf) {
        var $images = $("#images").empty();
        var frag = newT.frag();
        for (var i=0; len=bf.files.length, i<len; i++) {
          frag.appendChild(newT.render("image_item.bucket", bf.files[i]));
        }
        $images.append(frag);
        dfr.resolve(bf);
      });
    });
    
    return dfr;
  }
  
  function updateImageDimensions(bf) {
    var dfr = new RSVP.Promise();
    var img = newT.img({
      id:"bucket_img_dim_check", 
      src:bf.data.file_entry.toURL(), 
      style:"position:fixed; top:100%; left:100%;"
    });
    
    document.body.appendChild(img);
  
    setTimeout(function() {
    
      var image_size_params = {
        type: "update_metadata",
        file_name: bf.data.file_name,
        update_params: {
          height: img.height,
          width: img.width
        }
      };

      chrome.extension.sendMessage(image_size_params, function(response) {
        img.parentNode.removeChild(img);
        dfr.resolve();
        //console.log(response);
      });
    }, 50)

    return dfr;

  }
  
  newT.save("image_item.bucket", function(file) {
    var md = file.data.metadata,
        orig_url_type = md.get("original_url").match(/^https?\:\/\//) ? "a" : "span";
    return (
      newT.div({id:file.getKey(), "data-file_name":file.data.file_name},
        newT.img({src:file.data.file_entry.toURL()}),
        (md.get("title") ? 
          newT.strong({clss:"title"}, md.get("title")) : 
          newT[orig_url_type]({href:md.get("original_url"), target:"_blank", clss:"url", title:md.get("original_url")}, md.get("original_url").replace(/https?\:\/\//, ""))
        ),
        (md.get("notes") ? newT.p(md.get("notes")) : ""),
        (md.get("title") ? newT[orig_url_type]({href:md.get("original_url"), target:"_blank", clss:"url", title:md.get("original_url")}, md.get("original_url").replace(/https?\:\/\//, "")) : ""),
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