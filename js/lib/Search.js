(function() {


  BUCKET.search = function(q_obj) {
    var dfr = new RSVP.Promise();
    
    if(typeof q_obj === "string") {
      q_obj = {q:q_obj};
    }
    
    q_obj.results = [];
    q_obj.searched = false;
    
    BUCKET.fileStore.getFullMetadata().then(function(metadata) {
      doSearch(q_obj, metadata, dfr);
    }, function(e) { dfr.reject(e); });

    return dfr;

  }
  
  function doSearch(q_obj, metadata, dfr) {
    if (q_obj.q) { searchText(q_obj, metadata); }
    if (q_obj.mime_type) { searchMimeType(q_obj, metadata); }
    
    var unique_keys = {},
        results;
        
    if(q_obj.searched) {
    
      results = q_obj.results.filter(function(key) {
          if(key in unique_keys) { return false; } 
          else {unique_keys[key] = true; return true; }
        });
    } else {
      results = -1;
    }
        
    dfr.resolve(results);
        
    // BUCKET.fileStore.getFilesForKeys(results).then(function(files) {
    //   dfr.resolve(files);
    // }, function() {
    //   dfr.reject();
    // });
  }
  
  function searchText(q_obj, metadata) {
    q_obj.searched = true;
    var re = new RegExp(q_obj.q, "i");
    for(key in metadata) {
      meta_obj = metadata[key];
      if (meta_obj["title"] && meta_obj["title"].match(re)) {
        q_obj.results.push(key);
        continue;
      }
      if (meta_obj["notes"] && meta_obj["notes"].match(re)) { 
        q_obj.results.push(key);
        continue;
      }
      if (meta_obj["page_title"] && meta_obj["page_title"].match(re)) { 
        q_obj.results.push(key);
        continue;
      }
      if (meta_obj["original_url"] && meta_obj["original_url"].match(re)) { 
        q_obj.results.push(key);
        continue;
      }    
      if (meta_obj["page_url"] && meta_obj["page_url"].match(re)) { 
        q_obj.results.push(key);
        continue;
      }
    }
  }
  
  function searchMimeType(q_obj, metadata) {
    q_obj.searched = true;
    for(key in metadata) {
      meta_obj = metadata[key];
      if (meta_obj["mime_type"] && meta_obj["mime_type"] === q_obj.mime_type) {
        q_obj.results.push(key);
        continue;
      }
    }
  }

  
})();