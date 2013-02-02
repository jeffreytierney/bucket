(function() {

  var images = document.getElementById("images"),
      lk_promise = BUCKET.fileStore.listKeys(true),
      get_url_promise;
      
      
  lk_promise.then(function(keys) { 
    console.log(keys);
    for (var i=0; len=keys.length, i<len; i++) { 

      BUCKET.File.load(keys[i].name).loaded.then(function(bFile) {
        images.appendChild(newT.div(
          newT.img({src:window.URL.createObjectURL(bFile.data.file)})
        ));
        
        /*
        return bFile.readAsDataUrl().then(function(data_url) {
          console.log("hi");
            images.appendChild(newT.div(
              newT.img({src:data_url})
              //newT.p(JSON.stringify(bFile.data.metadata.toJSON()))
            ));
          }, function(e) { console.log("error", e) }
        );*/
      }, function(e) { console.log("error", e)})
      
    }
  });
  

  
})();