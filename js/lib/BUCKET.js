(function() {

  window.BUCKET = {
    util: {}
  };
  
  BUCKET.util.commify = function(num) {
    if (num === null) {return ''};
    var i, num_string_array = (num+"").split("").reverse();
    for( i=3; i<num_string_array.length; i+=4) {
        num_string_array.splice(i,0,",");
    }
    return num_string_array.reverse().join("");
  }

})();