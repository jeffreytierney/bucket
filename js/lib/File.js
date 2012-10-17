(function() {
  function bFile() {
    this.loaded = new RSVP.Promise();
  }
  
  bFile.prototype = {
    constructor: bFile.prototype.constructor,
    readAsDataUrl: function() {
      return BUCKET.fileStore.readFileAs(this.file, "DATA_URL");
    },
    readAsBinary: function() {
      return BUCKET.fileStore.readFileAs(this.file, "BINARY");
    }
  };
  
  bFile.load = function(name) {
    var bf = new bFile();
    
    BUCKET.fileStore.getFile(name).then(function(file_obj) {
      bf.file = file_obj;
      bf.loaded.resolve(bf);
    }, function() { bf.loaded.reject(); });
    
    return bf;
  }
  
  
  
  window.BUCKET.File = bFile;
})();