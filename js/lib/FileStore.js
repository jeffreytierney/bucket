;(function() {
  
  var storage_increment = (1024*1024*100), // 100 MB
      cur_quota = 0,
      METADATA_FILE = "bucket_metadata",
      USER_FILE     = "bucket_user";
      
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
                                  window.MozRequestFileSystem ||
                                  window.MSRequestFileSystem;
                                  
      window.StorageInfo        = window.StorageInfo ||
                                  window.webkitStorageInfo ||
                                  window.MozStorageInfo ||
                                  window.MSStorageInfo;
                                  
      window.Blob               = window.Blob ||
                                  window.WebKitBlob ||
                                  window.MozBlob ||
                                  window.MSBlob;
                                 
                                  
      this.support = !!(window.requestFileSystem && window.StorageInfo && window.Blob && window.JSON);
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
      error   = error   || function(ex) { 
        //console.log("Error checking quota: ", ex.message); 
      };
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
        function(ex) { 
          this.support = false; 
          //console.log("Error requesting storage: ", ex.message); 
        }
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
        if(xhr.status==200) { dfr.resolve(xhr); }
        else { dfr.reject(); }
        return true;
       };
       xhr.send(null);

      
      return dfr;
    },
    fetchAndStore: function(src) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      var _this = this;
          
      this.fetch(src).then(function(xhr) {
        return _this.store(new Uint8Array(xhr.response), xhr.getResponseHeader("Content-Type"));
      }).then(function(file_name) {
        dfr.resolve(file_name);
      });
      
      
      return dfr;

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
          }, function(e) { dfr.reject(e); });
        }, function(e) { dfr.reject(e); });
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
      
      //console.log(key)
      var _this = this;
      this.get(key).then(function(file) {
          //console.log(file);
          return _this.readFileAs(file, "BINARY");
        }, function(e) { 
          //console.log(e.message);
          dfr.reject(e);
      }).then(function(val) {
          dfr.resolve(val);
        }, function(e) {
          //console.log(e.message);
          dfr.reject(e);
      });
      
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
          return _this.readFileAs(file, "DATA_URL");
        }, function(e) {
          dfr.reject(e);
      }).then(function(val) {
        dfr.resolve(val);
      }, function(e) {
        dfr.reject(e);
      });
  
      return dfr;
    },
    readFileAs: function(file, data_type) {
      //console.log(file);
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
          val = this.result;
          dfr.resolve(val);
        }
        catch(e) {
          //console.log(e);
          dfr.reject(e);
        }
        
      };
      
      reader[method](file);

      return dfr;
    },
    store: function(val, type, key) {
      
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var _this = this;
      var onFSLoad = function(fs) { 
        
        //var bb = new BlobBuilder();
        //bb.append(val);
        var f = new FileReader();
        var blob = new Blob([val], {type: type || "image/jpeg"});
        
        f.onload = function(on_e) {
          //console.log(on_e.target.result);
          key = key || getFileKey(on_e.target.result, type);
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
                  //console.log('Write completed.');
                  dfr.resolve(key);
                }
              };

              fileWriter.onerror = dfr.reject;

              function doWrite(val, fileWriter) {
                //var blob = bb.getBlob(type || "image/jpeg")
                //console.log(blob);
                //console.log(fileWriter);
                fileWriter.write(blob);
              }
            }, function() { dfr.reject(); });
          }, function() { dfr.reject(); });
        }
        f.readAsDataURL(blob);
      }
      
      
      
      window.requestFileSystem(window.PERSISTENT, cur_quota, onFSLoad, function() { dfr.reject(); });
      return dfr;
    },
    removeFile: function(key) {
      var dfr = new RSVP.Promise();
      
      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      
      window.requestFileSystem(window.PERSISTENT, cur_quota, function(fs) {
        fs.root.getFile(key, {create: false}, function(fileEntry) {

          fileEntry.remove(function() {
            dfr.resolve();
            //console.log('File removed.');
          }, function() { dfr.reject(); });

        }, function() { dfr.reject(); });
      }, function() { dfr.reject(); });
      
      return dfr;
    },
    remove: function(key) {
      var dfr = new RSVP.Promise();

      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }

      var _this = this;
      this.removeFile(key).then(function(){
          return _this.removeFileMetadata(key);
        }, function(e) {
          return _this.removeFileMetadata(key);
      }).then(function() {
        //console.log("removed metadata")
          dfr.resolve(key);
        }, function(e) {
          //console.log(e)
          dfr.reject(e);
      })

      return dfr;
    },
    listKeys: function(filter_metadata) {
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
              if(filter_metadata) { 
                entries = entries.filter(function(key) { return (key.name != METADATA_FILE && key.name != USER_FILE); });
              }
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
    getSortedFiles: function(sort_key, order) {
      sort_key = sort_key || "ts";
      order = order || "desc";
      var ret_a = 1, ret_b = -1;
      if(order.toLowerCase === "desc") {
        ret_a = -1;
        ret_b = 1;
      }
      var lk_promise = BUCKET.fileStore.listKeys(true),
          sorted_files_promise = new RSVP.Promise(),
          files = [];

      lk_promise.then(function(keys) { 
        for (var i=0; len=keys.length, i<len; i++) { 
          BUCKET.File.load(keys[i].name).loaded.then(function(bFile) {
            files.push(bFile);
            if(files.length === keys.length) {
              console.log(files)
              files.sort(function(a,b) {
                return a.data.metadata.get(sort_key) < b.data.metadata.get(sort_key) ? ret_a : ret_b;  
              })
              sorted_files_promise.resolve(files);
            }
          }, function(e) { 
            //console.log("error", e)
          })
      
        }
      });
      return sorted_files_promise;
    },
    clear: function() {
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
    },
    
    
    getFullMetadata: function() {
      var dfr = new RSVP.Promise();

      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      var _this = this;
      //console.log(this);
      if (this.metadata_cache) {
        dfr.resolve(this.metadata_cache);
      }
      else {
        //console.log(METADATA_FILE);
        this.getAsBinary(METADATA_FILE).then(function(raw_data) {
          //console.log(raw_data);
          var json_data = JSON.parse(raw_data || "{}");
          _this.metadata_cache = json_data;
          dfr.resolve(_this.metadata_cache);
        }, function(e) { 
          //console.log(e);
          if (e && e.code && e.code === FileError.NOT_FOUND_ERR) {
            _this.metadata_cache = {};
            return _this.saveMetadata();
          } else {
            //console.log(e)
            dfr.reject(e);
          }
        }).then(function() {
          dfr.resolve(_this.metadata_cache);
        });
      }
      return dfr;
    },
    getFileMetadata: function(key) {
      var dfr = new RSVP.Promise();

      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var md_promise = this.getFullMetadata().then(function(data) {
        dfr.resolve(data[key] || {});
      }, function(e) { dfr.reject(e); });
      
      return dfr;
      
    },
    updateFileMetadata: function(key, metadata) {
      var dfr = new RSVP.Promise();

      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      //console.log(key,metadata);;
      var _this = this;
      var md_promise = this.getFullMetadata().then(function(data) {
          data[key] = metadata;
          return _this.saveMetadata();
        }, function() { 
          dfr.reject(); 
      }).then(function(saved_data) {
          dfr.resolve(saved_data);
        }, function() { 
          dfr.reject();
      });
      
      return dfr;
    },
    removeFileMetadata: function(key) {
      var dfr = new RSVP.Promise();

      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      //console.log(key);
      var _this = this;
      var md_promise = this.getFullMetadata().then(function(data) {
          delete data[key];
          return _this.saveMetadata();
        }, function() { 
          dfr.reject(); 
      }).then(function(saved_data) {
          dfr.resolve(saved_data);
        }, function() { 
          dfr.reject();
      });
      
      return dfr;
    },
    saveMetadata: function() {
      var dfr = new RSVP.Promise();

      if(!this.support) { 
        dfr.reject(); 
        return dfr;
      }
      
      var _this = this;
      var md_promise = this.getFullMetadata().then(function(data) {
          var stringified_data = JSON.stringify(data);
          return _this.store(stringified_data, "application/json", METADATA_FILE);
        }, function() { 
          dfr.reject(); 
      }).then(function(data) {
          dfr.resolve(data)
        }, function() {
          dfr.reject();
      });
      
      return dfr;
    }
    
    
  };
  
  
  function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
  }
  

  window.BUCKET.fileStore = new Store();

})();