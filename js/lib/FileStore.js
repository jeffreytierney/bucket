;(function() {
  
  var storage_increment = (1024*1024*100), // 100 MB
      cur_quota = 0;
      
      
  function getFileKey(data, type) {
    return CryptoJS.MD5(data).toString() + getFileExtension(type);
  }
  
  function getFileExtension(type) {
    switch(type.toLowerCase()) {
      case "image/jpeg":
      case "image/jpg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/gif":
        return ".gif";
    }
    return ".jpg";
  }
  
  
  function Store(options, onSupport, onNoSupport) {
    options = options || {};
    if (typeof options === "function") {
      onNoSupport = onSupport;
      onSupport = options;
      options = {};
    }
    
    this.opt = {};
    for(var opt in options) {
      this.opt[opt] = options[opt];
    }
    
    this.init(onSupport, onNoSupport);
  };

  Store.prototype = {
    constructor: Store.prototype.constructor,
    init: function(onSupport, onNoSupport) {
      
      if(!this._support(onSupport, onNoSupport)) { return this; }
      return this;
    },
    _support: function(onSupport, onNoSupport) {
      window.requestFileSystem  = window.requestFileSystem || 
                                  window.webkitRequestFileSystem ||
                                  window.mozRequestFileSystem;
                                  
      window.StorageInfo        = window.StorageInfo ||
                                  window.webkitStorageInfo ||
                                  window.mozStorageInfo;
                                  
      window.BlobBuilder        = window.BlobBuilder ||
                                  window.WebKitBlobBuilder ||
                                  window.mozBlobBuilder;
                                  
                                  
      this.support = !!(window.requestFileSystem && window.StorageInfo && window.BlobBuilder && window.JSON);
      this.enabled = false;
      this.checkQuota();
      
      if(this.support) {
        onSupport && onSupport.call(this);
      }
      else {
        onNoSupport && onNoSupport.call(this);
      }
      
      return this.support;
    },
    checkQuota: function(success, error) {
      success = success || function(usage, quota) { this.enabled = !!quota; };
      error   = error   || function(ex) { console.log("Error checking quota: ", ex.message); };
      if(!this.support) {
        error.call(window, {});
      }
      else {
        window.StorageInfo.queryUsageAndQuota(window.PERSISTENT, success, error);
      }
    },
    checkQuotaAndRequest: function(cb, forceRequest) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) {
        dfr.reject();
        return dfr;
      }
      
      var _this = this;
      if(this.support) {
        this.checkQuota(
          function(usage, quota) { 
            _this.enabled = !!quota;
            cur_quota = quota;
            if(forceRequest || (quota - usage < (1024*1024))) { 
              _this.requestPermission(quota+storage_increment, function(bytes_granted) {
                dfr.resolve();
              });
            }
            else {
              dfr.resolve();
            }
          },
          function() { dfr.reject(); }
        )
      }
      
      return dfr;
    },
    requestPermission: function(bytes) {
      var dfr = new RSVP.Promise();
      
      var _this = this;
      dfr.then(
        function(bytes_granted) { _this.support = true;  },
        function(ex) { this.support = false; console.log("Error requesting storage: ", ex.message); }
      );
      
      window.StorageInfo.requestQuota(window.PERSISTENT, bytes, dfr.resolve, function() { dfr.reject(); });
      
      return dfr;
    },
    fetch: function(src) {
      var dfr = new RSVP.Promise();
      var xhr;
      try { xhr= new XMLHttpRequest();} 
       catch (e) { try { xhr = new ActiveXObject("Microsoft.XMLHTTP"); } 
        catch (e) {return false;}
      }
       xhr.responseType = "arraybuffer"
       xhr.open("GET", src);
       xhr.onreadystatechange = function() {
        if(xhr.readyState != 4) { return; }
        if(xhr.status==200) { dfr.resolve(xhr, src); }
        else { dfr.reject(); }
        return true;
       };
       xhr.send(null);

      
      return dfr;
    },
    fetchAndStore: function(src) {
      
      var promise = this.fetch(src),
          _this = this;
          
      promise.then(function(xhr, src) {
        _this.store(xhr.response, xhr.getResponseHeader("Content-Type"));
      });
      
      console.log(promise);
      
      return promise;

    },
    getFile: function(key) {
      return this.get(key);
    },
    getFileEntry: function(key) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var onFSLoad = function(fs) { 

        fs.root.getFile(key, {}, function(fileEntry) {
          
          dfr.resolve(fileEntry);

        }, function() { dfr.reject(); });
      }

      window.requestFileSystem(window.PERSISTENT, cur_quota, onFSLoad, function() { dfr.reject(); });
      
      return dfr;
    },
    get: function(key) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var onFSLoad = function(fs) { 
        
        fs.root.getFile(key, {}, function(fileEntry) {
          // Get a File object representing the file,
          // then use FileReader to read its contents.
          fileEntry.file(function(file) {
             dfr.resolve(file);
          }, function() { dfr.reject(); });
        }, function() { dfr.reject(); });
      }
      
      window.requestFileSystem(window.PERSISTENT, cur_quota, onFSLoad, function() { dfr.reject(); });
      return dfr;
    },
    getAsBinary: function(key) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      this.get(key).then(function(file) {
        _this.readFileAs(file, "BINARY").then(function(val) {
          dfr.resolve(val);
        })
      })
      
      return dfr;
    },
    getAsDataURL: function(key) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var _this = this;
      this.get(key).then(function(file) {
        _this.readFileAs(file, "DATA_URL").then(function(val) {
          dfr.resolve(val);
        })
      });
      
      return dfr;
    },
    readFileAs: function(file, data_type) {
      
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var method = (data_type && (typeof data_type === "string") && data_type.toLowerCase() === "binary" ? "readAsText" : "readAsDataURL"),
          reader = new FileReader();

      reader.onloadend = function(e) {

        var val = {};
        try {
          //console.log(this.result)
          val = this.result;
        }
        catch(e) {
          dfr.reject(e);
        }
        dfr.resolve(val);
      };
      
      reader[method](file);

      return dfr;
    },
    store: function(val, type) {
      
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var _this = this;
      var onFSLoad = function(fs) { 
        
        var bb = new BlobBuilder();
        bb.append(val);
        var f = new FileReader();
        f.onload = function(on_e) {
          //console.log(on_e.target.result);
          var key = getFileKey(on_e.target.result, type);
            fs.root.getFile(key, {create:true}, function(fileEntry) {
              // Create a FileWriter object for our FileEntry (log.txt).
              fileEntry.createWriter(function(fileWriter) {

                // apparently writing a file does not clear out the old one first
                // so if overwriting with a shorter file, it leaves cruft at the end
                // so truncate first
                fileWriter.truncate(0);

                var truncated = false, 
                    length;

                fileWriter.onwriteend = function(e) {
                  // but truncate also triggers onwriteend
                  // so check for that here and re-call the actual write after truncation
                  if(!truncated) { 
                    truncated = true;
                    doWrite(val, fileWriter);
                  }


                  else {
                    // then only call the success handler on the real write.
                    // fun, right?
                    console.log('Write completed.');
                    dfr.resolve();
                  }
                };

                fileWriter.onerror = dfr.reject;

                function doWrite(val, fileWriter) {
                  var blob = bb.getBlob(type || "image/jpeg")
                  console.log(blob);
                  console.log(fileWriter);
                  fileWriter.write(blob);
                }
              }, function() { dfr.reject(); });
            }, function() { dfr.reject(); });
          }
          f.readAsDataURL(bb.getBlob());
        }
      
      
      
      window.requestFileSystem(window.PERSISTENT, cur_quota, onFSLoad, function() { dfr.reject(); });
      return dfr;
    },
    remove: function(key, cb) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      
      window.requestFileSystem(window.PERSISTENT, cur_quota, function(fs) {
        fs.root.getFile(key, {create: false}, function(fileEntry) {

          fileEntry.remove(function() {
            dfr.resolve();
            console.log('File removed.');
          }, function() { dfr.reject(); });

        }, function() { dfr.reject(); });
      }, function() { dfr.reject(); });
      
      return dfr;
    },
    listKeys: function(cb) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
     
      var onInitFs = function(fs) {
        var dirReader = fs.root.createReader();
        var entries = [];

        // Call the reader.readEntries() until no more results are returned.
        var readEntries = function() {
           dirReader.readEntries (function(results) {
            if (!results.length) {
              dfr.resolve(entries.sort());
            } else {
              entries = entries.concat(toArray(results));
              readEntries();
            }
          }, function() { dfr.reject(); });
        };

        readEntries(); // Start reading dirs.

      }
      
      window.requestFileSystem(window.PERSISTENT, cur_quota, onInitFs, function() { dfr.reject(); });
      return dfr;
    },
    clear: function(cb) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      // TODO: this
      var _this = this;
      var lk_promise = this.listKeys()
      lk_promise.then(function(results) {
        var keys = results.map(function(file) { return file.name; });
        keys.forEach(function(key) { _this.remove(key); });
        dfr.resolve();
      });
      
      return dfr;
    }
  };
  
  
  function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
  }
  

  window.BUCKET.fileStore = new Store();

})();