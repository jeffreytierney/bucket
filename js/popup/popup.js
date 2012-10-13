(function() {
  var fs = new FileStore();
  
  var images = document.getElementById("images");
  
  var lk_promise = fs.listKeys(),
      get_url_promise;
  lk_promise.done(function(key) { 
    for (var i=0; i< key.length; i++) { 
      get_url_promise = fs.getAsDataURL(key[i].name);
      get_url_promise.done(function(fr) { 
        images.appendChild(newT.img({src:fr}));
      })
    }
  });
  
  
  
})();