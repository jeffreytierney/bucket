(function() {
  GH.util.showEditForm = function(key) {
    closeForm();
    var file = GH.bg_page.GH.File.load(key);
    file.loaded.then(function() { // success
      //console.log(file);
      $(document.body).append(newT.render("edit_form.gh", file));
      
      $("#file_title").focus();
      
      $("#file_save_form_close, #file_save_form_cancel").on("click", function(e) {
        e.preventDefault();
        closeForm();
      });
      
      $("#file_save_form_save").on("click", function(e) {
        e.preventDefault();
        $("#file_save_form").submit();
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
          GH.util.reloadImage(key);
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
  
  newT.save("edit_form.gh", function(file) {
    var metadata = file.data.metadata,
        orig_url_type = metadata.get("original_url").match(/^https?\:\/\//) ? "a" : "span",
        page_url_type = metadata.get("page_url").match(/^https?\:\/\//) ? "a" : "span";
    
    return (
      newT.form({id:"file_save_form", clss:"clearfix"},
        newT.a({href:"#", id:"file_save_form_close", clss:"overlay-close"}, "x"),
        newT.fieldset(
          newT.label("Title:", newT.input({id:"file_title", clss:"text", value:metadata.get("title")})),
          newT.label("Notes:", newT.textarea({id:"file_notes"}, metadata.get("notes"))),
          newT.div({clss:"buttons clearfix"},
            newT.a({id:"file_save_form_save", href:"#", title:"Save", clss:"btn save"}, "Save"),
            newT.a({id:"file_save_form_cancel", href:"#", title:"Cancel", clss:"btn cancel"}, "Cancel"),

            newT.input({type:"submit", value:"Save", clss:"submit"})
          ),
          newT.strong({id:"details"}, "File Details"),
          newT.label("Height: ", newT.span(metadata.get("height"), "px"), " Width: ", newT.span(metadata.get("width"), "px")),
          newT.label("Original Url: ", newT[orig_url_type]({href:metadata.get("original_url"), title:metadata.get("original_url")}, metadata.get("original_url"))),
          newT.label("Saved From: ", newT[page_url_type]({href: metadata.get("page_url"), title: metadata.get("page_url")}, metadata.get("page_url"))),
          newT.label("Saved On: ", newT.strong(moment(metadata.get("ts")).format('MMM DD YYYY h:mm a'))),
          newT.label("Type: ", newT.strong(metadata.get("mime_type"))),
          newT.label("Size: ", newT.strong(GH.util.commify(metadata.get("size")), " KB"))

        ),
        newT.div({id:"file_form_image_container"}, 
          newT.img({src:file.data.file_entry.toURL()})
        )
      )
    )
  })
})();