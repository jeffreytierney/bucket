(function() {
  GH.FileGroup = function() {
    this.init();
  }
  
  GH.FileGroup.prototype = {
    constructor: GH.FileGroup.prototype.constructor,
    init: function() {
      this.files = [];
      this.display_files = [];
      this.hidden_files = [];
      this.filter_obj = "";
    },
    loadAll: function() {
      var dfr = new RSVP.Promise(),
          _this = this;
      GH.fileStore.getSortedFiles().then(function(files) {
        _this.files = files;
        dfr.resolve(_this);
      });
      
      return dfr;
    },
    clearFilter: function() {
      return this.filter("");
    },
    filter: function(q_obj) {
      if(typeof q_obj === "undefined") {
        q_obj = this.filter_obj;
      } else {
        this.filter_obj = q_obj;
      }
      
      var dfr = new RSVP.Promise(),
          _this = this;


      GH.search(q_obj).then(function(keys) {
        if(keys === -1) {
          _this.display_files = _this.files;
          _this.hidden_files = [];
        } else {
          var key_obj = {};
          _this.display_files = [];
          _this.hidden_files = [];
          for(var i=0, len=keys.length; i<len; i++) { key_obj[keys[i]] = true; }
          for(var i=0, len=_this.files.length; i<len; i++) {
            if (_this.files[i].data.file_name in key_obj) {
              _this.display_files.push(_this.files[i]);
            } else {
              _this.hidden_files.push(_this.files[i]);
            }
          }
        }
        if(typeof _this._onFilter.func === "function") {
          _this._onFilter.func.call(_this._onFilter.scope, _this);
        }
        dfr.resolve(_this);
        
      });
      return dfr;
    },
    _onFilter: {
      func: function(){},
      scope: null
    },
    setOnFilter: function(func, scope) {
      scope = scope || null;
      this._onFilter = {
        func: func,
        scope: scope
      };
    },
    export: function() {
      var dfr = new RSVP.Promise(),
          files = [];
          
      for(var i=0, len=this.files.length; i<len; i++) {
        (function(file) {
          file.readAsDataUrl().then(function(data_uri) {
            files.push({
              metadata:file.data.metadata.toJSON(), 
              data_uri: data_uri,
              file_name: file.data.file_name
            });
            
            if(files.length === len) {
              dfr.resolve(JSON.stringify(files));
            }
          })
        })(this.files[i]);
      }
      
      return dfr;
    }
  }
})();