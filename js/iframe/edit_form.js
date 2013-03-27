(function() {
  BUCKET.util.showEditForm = function(key) {
    var file = BUCKET.bg_page.BUCKET.File.load(key);
    file.loaded.then(function() { // success
      //console.log(file);
      $(document.body).append(newT.render("edit_form.bucket", file));
      
      $("#file_title").focus();
      
      $("#file_save_form_close").on("click", function(e) {
        e.preventDefault();
        closeForm();
      });
      
      $("#file_save_form").on("submit", function(e) {
        e.preventDefault();
        var image_metadata = {
          type: "update_metadata",
          file_name: key,
          update_params: {
            title: $("#file_title").val(),
            notes: $("#file_notes").val()
          }
        };
        chrome.extension.sendMessage(image_metadata, function(response) {
          closeForm();
          BUCKET.util.reloadImage(key);
        });
      })
      
      $(document.body).on("keydown.close_form", function(e) {
        var $tgt = $(e.target);
        if(e.keyCode === 27) {
          if($tgt.is("input,textarea")) {
            $tgt.blur();
          } else {
            closeForm();
          }
        }
      })
    });
  };
  
  function closeForm() {
    $("#file_save_form").remove();
    $(document.body).off("keydown.close_form")
  }
  
  newT.save("edit_form.bucket", function(file) {
    var metadata = file.data.metadata;
    return (
      newT.form({id:"file_save_form", clss:"clearfix"},
        newT.a({href:"#", id:"file_save_form_close", clss:"overlay-close"}, "x"),
        newT.div({id:"file_form_image_container"}, 
          newT.img({src:file.data.file_entry.toURL()})
        ),
        newT.fieldset(
          newT.label("Title:", newT.input({id:"file_title", clss:"text", value:metadata.get("title")})),
          newT.label("Notes:", newT.textarea({id:"file_notes"}, metadata.get("notes"))),
          newT.label("Height: ", newT.strong(metadata.get("height")), " Width: ", newT.strong(metadata.get("width"))),
          newT.label("Original Url: ", newT.a({href:metadata.get("original_url"), title:metadata.get("original_url")}, metadata.get("original_url"))),
          newT.label("Saved From: ", newT.a({href: metadata.get("page_url"), title: metadata.get("page_url")}, metadata.get("page_url"))),
          newT.label("Saved On: ", newT.strong(new Date(metadata.get("ts")))),
          newT.label("Type: ", newT.strong(metadata.get("mime_type"))),
          newT.label("Size: ", newT.strong(metadata.get("size"))),
          newT.input({type:"submit", value:"Save"})
        )
      )
    )
  })
})();