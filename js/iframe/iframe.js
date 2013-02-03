(function() {

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
  

  var images = document.getElementById("images"),
      sf_promise = BUCKET.fileStore.getSortedFiles(),
      get_url_promise;
      
      
  sf_promise.then(function(files) {
    for (var i=0; len=files.length, i<len; i++) { 
      images.appendChild(newT.div(
        newT.img({src:window.URL.createObjectURL(files[i].data.file)})
      ));
    }
  }, function(e) { console.log("error", e)});
  

  
})();