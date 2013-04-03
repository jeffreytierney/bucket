(function() {
  var images = document.getElementById("images"),
      lk_promise = GH.fileStore.listKeys(true),
      get_url_promise;
      
      
  lk_promise.then(function(keys) { 
    for (var i=0; len=keys.length, i<len; i++) { 

      GH.File.load(keys[i].name).loaded.then(function(bFile) {
        images.appendChild(newT.div(
          newT.img({src:bFile.data.file_entry.toURL()})
        ));

      }, function(e) { console.log("error", e)})
      
    }
  });
  
  
  
})();