(function() {

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

  var close_x = document.getElementById("close_iframe");
  close_x.addEventListener("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"remove_iframe"}, function(response) {
      console.log(response);
    });
  }, false);
  
  var swap_iframe_pos = document.getElementById("swap_position");
  swap_iframe_pos.addEventListener("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"swap_iframe_position"}, function(response) {
      console.log(response);
    });
  }, false);
  
  var open_in_new_window = document.getElementById("pop_out");
  open_in_new_window.addEventListener("click", function(e) {
    e.preventDefault();
    chrome.extension.sendMessage({type:"open_in_new_window"}, function(response) {
      console.log(response);
    });
  }, false);

  var images = document.getElementById("images"),
      sf_promise = BUCKET.fileStore.getSortedFiles(),
      get_url_promise;
      
      
  sf_promise.then(function(files) {
    for (var i=0; len=files.length, i<len; i++) {
      images.appendChild(newT.div(
        newT.img({src:files[i].data.file_entry.toURL()})
      ));
    }
  }, function(e) { console.log("error", e)});
  

  
})();