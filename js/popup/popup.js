(function() {
  var images = document.getElementById("images"),
      lk_promise = BUCKET.fileStore.listKeys(),
      get_url_promise;
      
      
  lk_promise.then(function(keys) { 
    console.log(keys);
    for (var i=0; i< keys.length; i++) { 
      get_url_promise = BUCKET.fileStore.getAsDataURL(keys[i].name);
      get_url_promise.then(function(fr) { 
        images.appendChild(newT.img({src:fr}));
      })
    }
  });
  
  
  
})();