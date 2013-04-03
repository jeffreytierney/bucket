(function() {
  chrome.runtime.getBackgroundPage(function(bg) { 
    init(bg);
  });
  
  function init(bg) {
    BUCKET.bg_page = bg;
    BUCKET.files = new BUCKET.bg_page.BUCKET.FileGroup();
    loadFiles().then(function(bf) {
      return checkIndividualFileTypes();
    }).then(function(bf) {
      return checkOldestFile();
    });
    checkQuota();

  }
  
  function loadFiles() {
    var dfr = new RSVP.Promise();
    BUCKET.files.loadAll().then(function(bf) {
      document.getElementById("num_images").appendChild(document.createTextNode(bf.files.length));
      dfr.resolve(bf);
    });
    return dfr;
  }
  
  function checkQuota() {
    BUCKET.bg_page.BUCKET.fileStore.checkQuota(function(used, q) { 
      document.getElementById("disk_space_used").appendChild(document.createTextNode(BUCKET.util.commify(used)+" KB"));
    });
  }

  function checkIndividualFileTypes() {
    var dfr = new RSVP.Promise(),
        total = 0;
    
    checkGifs();
    
    function checkGifs() {
      BUCKET.files.filter({mime_type:"image/gif"}).then(function(bf) {
        total += bf.display_files.length;
        document.getElementById("num_gifs").appendChild(document.createTextNode(bf.display_files.length));
        checkJpgs()
      });
    }

    function checkJpgs() {
      BUCKET.files.filter({mime_type:"image/jpeg"}).then(function(bf) {
        total += bf.display_files.length;
        document.getElementById("num_jpgs").appendChild(document.createTextNode(bf.display_files.length));
        checkPngs()
      });
    }
    
    function checkPngs() {   
      BUCKET.files.filter({mime_type:"image/png"}).then(function(bf) {
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
        bf = BUCKET.files;
    if(bf.files.length) {
      var oldest = bf.files[bf.files.length-1];
      oldest_date = moment(oldest.data.metadata.get("ts")).format('MMM DD YYYY h:mm a');
    }
        
    document.getElementById("first_saved_on").appendChild(document.createTextNode(oldest_date));
    return dfr;
  }

})();