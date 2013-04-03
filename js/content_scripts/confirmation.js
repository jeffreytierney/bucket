(function() {
  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.image_status === "success") {
        var img = newT.img({
              id:"gh_img", 
              src:request.image_data_uri, 
              style:"position:fixed; bottom:0; right:0;"
            });
            
        img.addEventListener("click", function(e) {
          e.preventDefault();
          img.parentNode.removeChild(img);
        });
        sendResponse({status: "woohoo"});
        document.body.appendChild(img);
        
        setTimeout(function() {
          
          var image_size_params = {
            type: "update_metadata",
            file_name: request.image_file_name,
            update_params: {
              height: img.height,
              width: img.width
            }
          };

          chrome.extension.sendMessage(image_size_params, function(response) {
            //console.log(response);
          });
          
        }, 50)
        
      } else if (request.image_status === "error") {
        alert("boohoo");
        sendResponse({status: "boohoo"});
      }
    }
  );
  
  
})();