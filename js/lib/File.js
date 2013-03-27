(function() {
  var regex = {
    data_uri: /data\:\s*([^;]+);\s*base64\,(.+)/i
  };
  
  function checkForDataURI(url) {
    return url.match(regex.data_uri);
  }
  
  function bFile() {
    this.loaded = new RSVP.Promise();
    this.data = {};
  }
  
  bFile.prototype = {
    constructor: bFile.prototype.constructor,
    readAsDataUrl: function() {
      return BUCKET.fileStore.readFileAs(this.data.file, "DATA_URL");
    },
    readAsBinary: function() {
      return BUCKET.fileStore.readFileAs(this.data.file, "BINARY");
    },
    getFileEntryUrl: function() {
      
    },
    loadFile: function(name) {
      return loadFile.call(this, name);
    }
  };
  
  /* PRIVATE FUNCTIONS */
  
  /* FUNCTION TO ACTUALLY DO HEAVY LIFTING OF LOADING A FILE */
  function loadFile(file_name) {
    var _this = this;
    BUCKET.fileStore.getFile(file_name, true).then(function(file_obj) {
      //console.log(file_obj);
      _this.data.file_name = file_obj.file.name;
      _this.data.file = file_obj.file;
      _this.data.file_entry = file_obj.file_entry;
      if (!_this.data.metadata) {
        //console.log(_this.data.file_name);
        BUCKET.fileStore.getFileMetadata(_this.data.file_name).then(function(metadata) {
          //console.log(metadata);
          _this.data.metadata = new BUCKET.FileMetadata(metadata);
          //console.log(_this);
          _this.loaded.resolve(_this);
        }, function(e) {
          //console.log(e);
          _this.loaded.reject(e);
        });
      } else {
        _this.loaded.resolve(_this);
      }
    }, function(e) { 
      //console.log(e);
      _this.loaded.reject(e); 
    });
    return _this;
  }
  
  /* FUNCTION TO CONVERT DATA URI TO BINARY ARRAY BUFFER */
  
  function convertToArrayBuffer(data_str) {
    var data = atob(data_str),
        array_buffer = new Uint8Array(data.length);
        
    for (var i = 0; i < data.length; i++) {
        array_buffer[i] = data.charCodeAt(i) & 0xff;
    }
    
    return array_buffer;
  }
  
  /* STATIC INITIALIZERS */
  
  bFile.load = function(name) {
    var bf = new bFile();
    
    return loadFile.call(bf, name);
  }
  

  
  bFile.newFromURI = function(url, metadata) {
    var matches = checkForDataURI(url);
        
    if(matches) { 
      return bFile.newFromDataURI(matches, metadata);
    } else {
      return bFile.newFromRemoteURL(url, metadata);
    }
    
    return bf;
  }
  
  bFile.newFromRemoteURL = function(url, metadata) {
    metadata = metadata || {};
    metadata.original_url = url;
    var bf = new bFile();
    
    var _file_details;
    BUCKET.fileStore.fetchAndStore(url).then(function(file_details) {
        _file_details = file_details;
        return BUCKET.fileStore.getFileMetadata(_file_details.key);
      }, function() {
        bf.loaded.reject();
    }).then(function(found_metadata) {
        if(found_metadata && found_metadata.ts) {
          metadata = found_metadata;
        }
        metadata["mime_type"] = _file_details.type;
        metadata["size"] = _file_details.size;
        bf.data.metadata = new BUCKET.FileMetadata(metadata);
        return BUCKET.fileStore.updateFileMetadata(_file_details.key, bf.data.metadata.toJSON());

      }, function() {
        bf.loaded.reject();
    }).then(function() {
        loadFile.call(bf, _file_details.key);
      }, function() {
        bf.loaded.reject();
    });
    
    return bf;
  }
  
  bFile.newFromDataURI = function(url, metadata) {
    metadata = metadata || {};
    metadata.original_url = "";

    var bf = new bFile();


    var matches = url;
    if (typeof url === "string") {
      matches = checkForDataURI(url);
    }
    
    if (matches) {
      var mime_type = matches[1],
          data = convertToArrayBuffer(matches[2]);
      
      var _file_details;
      BUCKET.fileStore.store(data, mime_type).then(function(file_details) {
          _file_details = file_details
          return BUCKET.fileStore.getFileMetadata(_file_details.key);
        }, function() {
          bf.loaded.reject();
      }).then(function(found_metadata) {
          if(found_metadata && found_metadata.ts) {
            metadata = found_metadata;
          }
          metadata["mime_type"] = _file_details.type;
          metadata["size"] = _file_details.size;
          bf.data.metadata = new BUCKET.FileMetadata(metadata);
          return BUCKET.fileStore.updateFileMetadata(_file_details.key, bf.data.metadata.toJSON());   
          
        }, function() {
          bf.loaded.reject();
      }).then(function() {
          loadFile.call(bf, _file_details.key);
        }, function() {
            bf.loaded.reject();
      });
      
    } else {
      bf.loaded.reject();
    }
    
    return bf;
  }
  
  
  
  
  window.BUCKET.File = bFile;
})();