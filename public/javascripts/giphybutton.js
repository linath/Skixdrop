

var GiphyButton = (function () {
    
  // private variables and functions
  var giphyButtonId = "giphyButton";
  var giphyTextInput = "giphyTextInput";
  var giphyDialogId = "giphyDialog";
  var jqxhr;
  var searchResultsCount = 6;

  // constructor
  var GiphyButton = function (buttonId, textInputId, dialogId, numberOfSearchResults) {
        
    if(typeof buttonId !== 'undefined'){
      giphyButtonId = "#" + buttonId;
    }
        
    if(typeof textInputId !== 'undefined'){
      giphyTextInput = "#" + textInputId;
    }

    if(typeof dialogId !== 'undefined'){
      giphyDialogId = "#" + dialogId;
    }

    if(typeof numberOfSearchResults !== 'undefined'){
      searchResultsCount = numberOfSearchResults;
    }

    if(typeof $(giphyButtonId) === 'undefined'){
        console.log("No button is defined under id " + giphyButtonId);
    }

    if(typeof $(giphyTextInput) === 'undefined'){
        console.log("No input field is defined under id " + giphyTextInput);
    }

    if(typeof $(giphyDialogId) === 'undefined'){
        console.log("No dialog div is defined under id " + giphyDialogId);
    }

    createModalDialog();

    // register event listeners

    $("#giphyModalInput").keyup(function() {
      loadGifs(this.value);
    });

    $(giphyButtonId).click(function(){
      $( "#giphyUrls" ).empty();
      $(giphyDialogId).modal('show');
    });

    // required to make text input focus work in google chrome.
    $(giphyButtonId).mouseup(function(e){
      e.preventDefault();
    });

    $(giphyDialogId).on('shown.bs.modal', function() {
        var input = $(giphyDialogId + " > #giphyModalDialog" +
                        " > #giphyModalContent" +
                        " > #giphyModalBody" + 
                        " > #giphyModalInput");
        input.val("");
        input.focus();
    });
  
  };

  function createModalDialog() {
    var modalFadeDiv = $(giphyDialogId);

    modalFadeDiv.attr('id', 'giphyModal').addClass( "modal fade" );
    
    // add dialog div
    var modalDialogDiv = $("<div>").appendTo(modalFadeDiv);
    modalDialogDiv.attr('id', 'giphyModalDialog');
    modalDialogDiv.addClass("modal-dialog");

    // add content div
    var contentDiv = $("<div>").appendTo(modalDialogDiv);
    contentDiv.attr('id', 'giphyModalContent');
    contentDiv.addClass("modal-content");

    // add header div
    var headerDiv = $("<div>").appendTo(contentDiv);
    headerDiv.addClass("modal-header");

    var closeButton = $("<button>&times;</button>").appendTo(headerDiv);
    closeButton.addClass("close").
    attr('type','button').
    attr('data-dismiss', 'modal').
    attr('aria-hidden', 'true')

    var headerTitle = $("<h4>Pick a gif from giphy.com</h4>").appendTo(headerDiv);
    headerTitle.addClass("modal-title");    

    // add body div
    var bodyDiv = $("<div>").appendTo(contentDiv);
    bodyDiv.addClass("modal-body");
    bodyDiv.attr('id', 'giphyModalBody');

    $("<p>Add search terms separated by spaces.</p>").appendTo(bodyDiv);
    $("<label for=\"giphyModalInput\">Search:</label>").appendTo(bodyDiv);
    
    var searchInput = $("<input>").appendTo(bodyDiv);
    searchInput.attr('type','text').
    attr('id','giphyModalInput').
    attr('name','search').
    attr('autofocus','');
    
    var giphyUrlsDiv = $("<div>").appendTo(bodyDiv);
    giphyUrlsDiv.attr('id','giphyUrls');

    // add footer div
    var footerDiv = $("<div>").appendTo(contentDiv);
    footerDiv.addClass("modal-footer");
  }

  function loadGifs(searchString) {
    
    $( "#giphyUrls" ).empty();

    if(typeof jqxhr !== 'undefined'){
       jqxhr.abort();
    };
   
    var search = getSearchQuery(searchString);

    if(search) {
      jqxhr = $.get( "http://api.giphy.com/v1/gifs/search?q=" + search + "&api_key=dc6zaTOxFJmzC")
      .done(function(result) {
        appendGifUrls("#giphyUrls", result.data)
      })
      .fail(function(xhr, text_status, error_thrown) {
        if (text_status != "abort") {
          $( "#giphyUrls" ).append( "<p>Couldn't load gifs. Sorry...</p>" );
        }
      });  
    }
    
  }

  function getSearchQuery(searchString) {
    var values = searchString.split(" ");
    return values.join('+');
  }

  function appendGifUrls(id, data) {
    
    var images = new Array();
    data.forEach(function(entry) {

      var url = entry.images.fixed_width.url;
      
      if(typeof url !== 'undefined'){
        images.push(url);
      };
      
    });
    var list = addList(id, images);
  }

  function addList(id, listData){
          
    var listContainer = $(id);
    var listDiv = $("<div class=\"giphyList\">").appendTo(listContainer);
    var list = $("<ul>").appendTo(listDiv);

    for (i = 0; i < searchResultsCount; i++) { 
      var listItem = $("<li>").appendTo(list);
      var imageTag = '<img src="' + listData[i] + '" alt="gif" data-dismiss="modal"/>';
      var image = $(imageTag).appendTo(listItem);
      image.click(function(event) {
        postImageLink(event);
      });
    }
  }

  function postImageLink(event) {
    if(typeof event.target.src !== 'undefined'){

      var currentValue = $(giphyTextInput).val();

      if(currentValue.length > 0) {
        currentValue = currentValue + " ";
      }

      $(giphyTextInput).val(currentValue + event.target.src);

    };
  }

  // prototype
  GiphyButton.prototype = {
    constructor: GiphyButton,
  };

  return GiphyButton;

})();