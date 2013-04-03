(function() {
  chrome.runtime.getBackgroundPage(function(bg) { 
    init(bg);
  });
  
  function init(bg) {
    GH.bg_page = bg;
    GH.files = new GH.bg_page.GH.FileGroup();
    runChecks();
  }
  
  function runChecks() {
    loadFiles().then(function(bf) {
      return checkIndividualFileTypes();
    }).then(function(bf) {
      return checkOldestFile();
    }).then(function(bf) {
      return checkExtremeFileSizes();
    }).then(function(bf) {
      return checkExtremeImageSizes();
    });
    checkQuota();

  }
  
  function loadFiles() {
    var dfr = new RSVP.Promise();
    GH.files.loadAll().then(function(bf) {
      $("#num_images").html(document.createTextNode(bf.files.length));
      dfr.resolve(bf);
    });
    return dfr;
  }
  
  function checkQuota() {
    GH.bg_page.GH.fileStore.checkQuota(function(used, q) { 
      $("#disk_space_used").html(document.createTextNode(GH.util.commify(used)+" KB"));
    });
  }

  function checkIndividualFileTypes() {
    var dfr = new RSVP.Promise(),
        total = 0;
    
    checkGifs();
    
    function checkGifs() {
      GH.files.filter({mime_type:"image/gif"}).then(function(bf) {
        total += bf.display_files.length;
        $("#num_gifs").html(document.createTextNode(bf.display_files.length));
        checkJpgs()
      });
    }

    function checkJpgs() {
      GH.files.filter({mime_type:"image/jpeg"}).then(function(bf) {
        total += bf.display_files.length;
        $("#num_jpgs").html(document.createTextNode(bf.display_files.length));
        checkPngs()
      });
    }
    
    function checkPngs() {   
      GH.files.filter({mime_type:"image/png"}).then(function(bf) {
        total += bf.display_files.length;
        $("#num_pngs").html(document.createTextNode(bf.display_files.length));
        calculateOther(bf);
      });
    }
    
    function calculateOther(bf) {
      $("#num_other_types").html(document.createTextNode(bf.files.length - total));
      bf.clearFilter().then(function() {
        dfr.resolve(bf);
      });
    }
    
    return dfr;

  }
  
  function checkOldestFile() {
    var dfr = new RSVP.Promise(),
        oldest_date = "None",
        bf = GH.files;
    if(bf.files.length) {
      var oldest = bf.files[bf.files.length-1];
      oldest_date = moment(oldest.data.metadata.get("ts")).format('MMM DD YYYY h:mm a');
    }
        
    $("#first_saved_on").html(document.createTextNode(oldest_date));
    dfr.resolve();
    return dfr;
  }
  
  function checkExtremeFileSizes() {
    var dfr = new RSVP.Promise(),
        total_size = 0,
        max_size = 0,
        min_size = 0,
        average_size = 0,
        bf = GH.files;
        
    var size;
    for(var i=0, len=bf.files.length; i<len; i++) {
      size = bf.files[i].data.metadata.get("size");
      total_size += size;
      if(!min_size || size < min_size) { min_size = size; }
      if(size > max_size) { max_size = size; }
    }
    
    if(bf.files.length) {
      average_size = Math.round(total_size / bf.files.length);
    }
    
    $("#largest_file_size").html(document.createTextNode(GH.util.commify(max_size)+" KB"));
    $("#smallest_file_size").html(document.createTextNode(GH.util.commify(min_size)+" KB"));
    $("#average_file_size").html(document.createTextNode(GH.util.commify(average_size)+" KB"));
    dfr.resolve();
    return dfr;
  }
  
  function checkExtremeImageSizes() {
    var dfr = new RSVP.Promise(),
        max_size = 0, max,
        min_size = 0, min,
        bf = GH.files;
        
    var size;
    for(var i=0, len=bf.files.length; i<len; i++) {
      file = bf.files[i],
      size = file.data.metadata.get("height") * file.data.metadata.get("width");
      if(!min_size || size < min_size) { min_size = size; min = file; }
      if(size > max_size) { max_size = size; max = file; }
    }

              $("#largest_image_size").html(document.createTextNode(GH.util.commify(max.data.metadata.get("width"))+" x "+GH.util.commify(max.data.metadata.get("height"))));
    $("#smallest_image_size").html(document.createTextNode(GH.util.commify(min.data.metadata.get("width"))+" x "+GH.util.commify(min.data.metadata.get("height"))));
    dfr.resolve();
    return dfr;
  }
  
  
  $("#export").on("click", function(e) {
    e.preventDefault();
    GH.files.export().then(function(ex) {
      //document.execCommand('SaveAs',null,"gifhorse_export.json")
      //$("#export_box").val(ex);
      
      var blob = new Blob([ex], {type: "application/octet-stream", name:"gifhorse_export.json"});
      var saveas = document.createElement("iframe");
      saveas.style.display = "none";

      if(!!window.createObjectURL == false) {
        saveas.src = window.webkitURL.createObjectURL(blob); 
      }
      else {
        saveas.src = window.createObjectURL(blob); 
      }

      document.body.appendChild(saveas);
      
    })
  });

  $("#import_form").on("submit", function(e) {
    e.preventDefault();
    var file;
    if(document.getElementById("import").files.length) {
      file = document.getElementById("import").files[0];
    }
    
    if(file) {
      this.reset();
      var reader = new FileReader();
          

      reader.onloadend = function(e) {

        var val = {};
        try {
          val = JSON.parse(this.result);
          if (typeof val === "object" && val.slice && val.length) {
            var can_import = true;
            for(var i=0, len=val.length; i<len; i++) { 
              if(val[i].metadata && val[i].data_uri && val[i].file_name) {
                continue;
              } else {
                can_import = false
                break;
              }
            }
            if(can_import) {
              doImport(val);
            }
          }
        }
        catch(e) {
          console.log(e);
          //dfr.reject(e);
        }
        
      };
      
      reader.readAsText(file);
    }
  });
  
  var $import_status = $("#import_status"),
      $status_update = $("#status_update");

  function doImport(files) {
    var len = files.length;
    
    $import_status.addClass("is-importing");
    doImportOne(0, files)
    
  }
  
  function doImportOne(i, files) {
    if(i < files.length) {
      GH.bg_page.GH.File.newFromDataURI(files[i].data_uri, files[i].metadata).loaded.then(function() {
        GH.files.loadAll().then(function() {
          runChecks();
          setImportStatus(i+1, files.length);
          doImportOne(i+1, files);
        })
      });
    }
  }
  
  function setImportStatus(i, len) {
    if(i===len) {
      $status_update.html("Import Complete... " + i + " of " + len + " images imported");
      setTimeout(function() {
        $import_status.removeClass("is-importing");
        $status_update.html("");
      }, 2000);
    } else {
      $status_update.html("Imported " + i + " of " + len + " images...");
    }
  }

})();