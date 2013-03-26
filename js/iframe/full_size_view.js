(function() {
  BUCKET.util.showFullSize = function(key) {
    var file = BUCKET.bg_page.BUCKET.File.load(key);
    file.loaded.then(function() { // success
      $(document.body).append(newT.render("full_size_view.bucket", file));
      $("#full_size_view_close").on("click", function(e) {
        e.preventDefault();
        closeView();
      }).focus();
      $(document.body).on("keydown.close_form", function(e) {
        var $tgt = $(e.target);
        if(e.keyCode === 27) {
          closeView();
        }
      })
      
    });
  }
  
  function closeView() {
    $("#full_size_view").remove();
    $(document.body).off("keydown.close_form")
  }
  
  newT.save("full_size_view.bucket", function(file) {
    var metadata = file.data.metadata;
    return (
      newT.div({id:"full_size_view", clss:"clearfix"},
        newT.a({href:"#", id:"full_size_view_close", clss:"overlay-close"}, "x"),
        newT.img({src:file.data.file_entry.toURL(), style:("margin-top:"+(-1*Math.floor(metadata.get("height")/2))+"px; margin-left:"+(-1*Math.floor(metadata.get("width")/2))+"px;")})
      )
    )
  })
})();