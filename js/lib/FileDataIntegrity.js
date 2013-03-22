(function() {
  BUCKET.FileDataIntegrity = {
    checkAll:function() {
      BUCKET.fileStore.getSortedFiles().then(function(files) {
          for (var i=0; len=files.length, i<len; i++) (function(f) {
            for (var j = 0, check_len = integrityChecks.length; j<check_len; j++) {
              integrityChecks[j].call(f);
            }
          })(files[i])
        }, function(e) { console.log("error", e)}
      );
    }
  }
  
  // these are to be called with the BUCKET.File item as the scope
  // so this should always refer to a file object.
  var integrityChecks = [
    function mimeAndSize() {
      var metadata_update = {},
          needs_update = false;
      if(!this.data.metadata.get("mime_type")) {
        metadata_update["mime_type"] = this.data.file.type;
        needs_update = true;
      }
      if(!this.data.metadata.get("size")) {
        metadata_update["size"] = this.data.file.size;
        needs_update = true;
      }
      if(needs_update) {
        this.data.metadata.setVals(metadata_update);
        console.log(this.data.file_name, this.data.metadata.toJSON());
        BUCKET.fileStore.updateFileMetadata(this.data.file_name, this.data.metadata.toJSON());
      }
    }
  ];  
})();