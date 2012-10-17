(function() {
  var images = document.getElementById("images"),
      lk_promise = BUCKET.fileStore.listKeys(),
      get_url_promise;
      
      
  lk_promise.then(function(keys) { 
    console.log(keys);
    for (var i=0; len=keys.length, i<len; i++) { 
      /*
      get_url_promise = BUCKET.fileStore.getAsDataURL(keys[i].name);
      get_url_promise.then(function(fr) { 
        images.appendChild(newT.img({src:fr}));
      })
      */
      BUCKET.File.load(keys[i].name).loaded.then(function(bFile) {
        return bFile.readAsDataUrl();
      }).then(function(data_url) {
          images.appendChild(newT.img({src:data_url}));
        }, function(e) { console.log(e) }
      );
      
    }
  });
  
  
  
})();