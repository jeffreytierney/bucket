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
      document.getElementById("num_images").appendChild(document.createTextNode(bf.files.length));
      dfr.resolve(bf);
    });
    return dfr;
  }
  
  function checkQuota() {
    GH.bg_page.GH.fileStore.checkQuota(function(used, q) { 
      document.getElementById("disk_space_used").appendChild(document.createTextNode(GH.util.commify(used)+" KB"));
    });
  }

  function checkIndividualFileTypes() {
    var dfr = new RSVP.Promise(),
        total = 0;
    
    checkGifs();
    
    function checkGifs() {
      GH.files.filter({mime_type:"image/gif"}).then(function(bf) {
        total += bf.display_files.length;
        document.getElementById("num_gifs").appendChild(document.createTextNode(bf.display_files.length));
        checkJpgs()
      });
    }

    function checkJpgs() {
      GH.files.filter({mime_type:"image/jpeg"}).then(function(bf) {
        total += bf.display_files.length;
        document.getElementById("num_jpgs").appendChild(document.createTextNode(bf.display_files.length));
        checkPngs()
      });
    }
    
    function checkPngs() {   
      GH.files.filter({mime_type:"image/png"}).then(function(bf) {
        total += bf.display_files.length;
        document.getElementById("num_pngs").appendChild(document.createTextNode(bf.display_files.length));
        calculateOther(bf);
      });
    }
    
    function calculateOther(bf) {
      document.getElementById("num_other_types").appendChild(document.createTextNode(bf.files.length - total));
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
        
    document.getElementById("first_saved_on").appendChild(document.createTextNode(oldest_date));
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
    
    document.getElementById("largest_file_size").appendChild(document.createTextNode(GH.util.commify(max_size)+" KB"));
    document.getElementById("smallest_file_size").appendChild(document.createTextNode(GH.util.commify(min_size)+" KB"));
    document.getElementById("average_file_size").appendChild(document.createTextNode(GH.util.commify(average_size)+" KB"));
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

              document.getElementById("largest_image_size").appendChild(document.createTextNode(GH.util.commify(max.data.metadata.get("width"))+" x "+GH.util.commify(max.data.metadata.get("height"))));
    document.getElementById("smallest_image_size").appendChild(document.createTextNode(GH.util.commify(min.data.metadata.get("width"))+" x "+GH.util.commify(min.data.metadata.get("height"))));
    dfr.resolve();
    return dfr;
  }

})();