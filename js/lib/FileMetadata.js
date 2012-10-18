(function() {

  var white_list = {
    original_url: {uneditable: true},
    page_url: {non_empty:true, uneditable: true },
    page_favicon: {uneditable: true },
    page_title: {uneditable: true },
    ts: {uneditable: true, non_empty:true, default_value: function() { return +new Date(); }},
    shares: {default_value:[], non_empty:true},
    title: {default_value: ""},
    notes: {default_value: ""}
  };

  function bFileMetadata(data) {
    this.init(data);
  }
  
  
  function fillOutDefaults() {
    for (var key in white_list) {
      if (!this.data.hasOwnProperty(key)) {
        this.set(key, "");
      }
    }
  }
  
  bFileMetadata.prototype = {
    constructor: bFileMetadata.prototype.constructor,
    init: function(data) {
      data = data || {};
      
      this.data = {};
      this.setVals(data);
      
      fillOutDefaults.call(this);
      
    },
    setVals: function(data) {
      var default_obj;
      for (var key in data) {
        this.set(key, data[key]);
      }
    },
    get: function(key) {
      return this.data[key];
    },
    set: function(key, val) {
      default_obj = white_list[key];
      // if not whitelisted, just skip it
      if (!default_obj) { return; }
      // set default if empty and there is a default
      if(!val && default_obj.default_value) { val = (typeof default_obj.default_value === "function" ? default_obj.default_value() : default_obj.default_value); }
      // if still empty, and cant be empty, throw an error
      if(default_obj.non_empty && !val) { throw new Exception("Metadata item: " + key + " can not be empty"); }
      // if a value previously existed (even if null), and the new one is different, and it is not editable, throw an error
      if(this.data.hasOwnProperty(key) && default_obj.uneditable && val != this.get(key)) { throw new Exception("Metadata item: " + key + " can not be edited"); }
      
      
      // finally, just set it and forget it.
      this.data[key] = val;
      
    },
    toJSON: function() {
      return this.data;
    }
  }
  
  window.BUCKET.FileMetadata = bFileMetadata;
})();