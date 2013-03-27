(function() {
  BUCKET.FileGroup = function() {
    this.init();
  }
  
  BUCKET.FileGroup.prototype = {
    constructor: BUCKET.FileGroup.prototype.constructor,
    init: function() {
      this.files = [];
      this.display_files = [];
      this.hidden_files = [];
      this.filter_obj = "";
    },
    loadAll: function() {
      var dfr = new RSVP.Promise(),
          _this = this;
      BUCKET.fileStore.getSortedFiles().then(function(files) {
        _this.files = files;
        dfr.resolve(files);
      });
      
      return dfr;
    },
    clearFilter: function() {
      this.filter("");
    },
    filter: function(q_obj) {
      if(typeof q_obj === "undefined") {
        q_obj = this.filter_obj;
      } else {
        this.filter_obj = q_obj;
      }
      
      var dfr = new RSVP.Promise(),
          _this = this;


      BUCKET.search(q_obj).then(function(keys) {
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
    }
  }
})();