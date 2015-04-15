

var GiphyButton = (function () {
    
  // private variables and functions
  var giphyButtonId = "giphyButton";
  var giphyTextInput = "giphyTextInput";
  var giphyDialogId = "giphyDialog";

  var jqxhr;
  var pageSize = 6;
  var imageLinkMap = {};
  var pagingOffset = 0;

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
      pageSize = numberOfSearchResults;
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
      pagingOffset = 0;
      loadGifs();
    });

    $(giphyButtonId).click(function(){
      $( "#giphyUrls" ).empty();
      $(giphyDialogId).modal('show');
    });

    $('#giphyPagingButtonBack').click(function(){
      decreasePagingOffset();
    });

    $('#giphyPagingButtonForward').click(function(){
      increasePagingOffset();
    });

    // required to make text input focus work in google chrome.
    $(giphyButtonId).mouseup(function(e){
      e.preventDefault();
    });

    // set focus to dialog
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
    
    // add giphy search input field
    var searchInput = $("<input>").appendTo(bodyDiv);
    searchInput.attr('type','text').
    attr('id','giphyModalInput').
    attr('name','search').
    attr('autofocus','');
    
    // add giphy image thumbnails div
    var giphyUrlsDiv = $("<div>").appendTo(bodyDiv);
    giphyUrlsDiv.attr('id','giphyUrls');

    // add paging buttons div
    var giphyPagingButtonsDiv = $("<div>").appendTo(bodyDiv);
    giphyPagingButtonsDiv.attr('id', 'giphyPagingButtons');
    giphyPagingButtonsDiv.addClass("text-center");
    giphyPagingButtonsDiv.css('padding', '10px');

    var giphyPagingButtonBack = $("<button>").appendTo(giphyPagingButtonsDiv);
    giphyPagingButtonBack.attr('id', 'giphyPagingButtonBack');
    giphyPagingButtonBack.addClass("btn btn-xs btn-default");
    giphyPagingButtonBack.addClass("glyphicon glyphicon-arrow-left");
    giphyPagingButtonBack.css('margin-right', '5px');
    giphyPagingButtonBack.hide();

    var giphyPagingButtonForward = $("<button>").appendTo(giphyPagingButtonsDiv);
    giphyPagingButtonForward.attr('id', 'giphyPagingButtonForward');
    giphyPagingButtonForward.addClass("btn btn-xs btn-default");
    giphyPagingButtonForward.addClass("glyphicon glyphicon-arrow-right");
    giphyPagingButtonForward.css('margin-left', '5px');
    giphyPagingButtonForward.hide();

    // add footer div
    var footerDiv = $("<div>").appendTo(contentDiv);
    footerDiv.addClass("modal-footer");
  }

  function loadGifs() {

    var searchString = $("#giphyModalInput").val();
    
    $( "#giphyUrls" ).empty();

    if(typeof jqxhr !== 'undefined'){
       jqxhr.abort();
    };
   
    var search = getSearchQuery(searchString);

    if(search) {

      var url = "http://api.giphy.com/v1/gifs/search?" +
                "q=" + search + 
                "&limit=" + pageSize +
                "&offset=" + pagingOffset + 
                "&api_key=dc6zaTOxFJmzC";

      jqxhr = $.get(url)
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

  function decreasePagingOffset() {
    pagingOffset = pagingOffset - pageSize; 
    loadGifs();

    if(pagingOffset == 0) {
      $('#giphyPagingButtonBack').hide();
    }
  }

  function increasePagingOffset() {
    if(pagingOffset == 0) {
      $('#giphyPagingButtonBack').show();
    }

    pagingOffset = pagingOffset + pageSize;
    loadGifs();
  }

  function getSearchQuery(searchString) {
    var values = searchString.split(" ");
    return values.join('+');
  }

  function appendGifUrls(id, data) {

    // reset image link map
    imageLinkMap = {};

    if(data.length == 0) {
      $('#giphyPagingButtonBack').hide();
      $('#giphyPagingButtonForward').hide();
      addNoItemsFoundMessage(id);
      return;
    }

    $('#giphyPagingButtonForward').show();

    var images = new Array();    
    data.forEach(function(entry) {
      if( typeof entry.images.fixed_width.url !== 'undefined' && 
          typeof entry.images.original.url !== 'undefined' ){
        imageLinkMap[entry.images.fixed_width.url] = entry.images.original.url;
        images.push(entry.images.fixed_width.url);
      };
    });

    var list = addList(id, images);
  }

  function addList(id, listData){
          
    var listContainer = $(id);
    var listDiv = $("<div class=\"giphyList\">").appendTo(listContainer);
    var list = $("<ul>").appendTo(listDiv);
    var searchResults = listData.length < pageSize ? listData.length : pageSize;

    for (i = 0; i < searchResults; i++) { 
      var listItem = $("<li>").appendTo(list);
      var imageTag = '<img src="' + listData[i] + '" alt="gif" data-dismiss="modal"/>';
      var image = $(imageTag).appendTo(listItem);
      image.click(function(event) {
        postImageLink(event);
      });
    }
  }

  function addNoItemsFoundMessage(id) {
    var listContainer = $(id);
    var noItemsFoundParagraph = $("<p>No items found. Try another search phrase.</p>").appendTo(listContainer);
    noItemsFoundParagraph.addClass("text-center");
  }

  function postImageLink(event) {
    if(typeof event.target.src !== 'undefined'){

      var currentValue = $(giphyTextInput).val();

      if(currentValue.length > 0) {
        currentValue = currentValue + " ";
      }

      // get original size gif url
      var gifUrl = imageLinkMap[event.target.src];

      if(typeof gifUrl !== 'undefined') {
        $('#giphyPagingButtonBack').hide();
        $('#giphyPagingButtonForward').hide();
        $(giphyTextInput).val(currentValue + gifUrl);
      }

    };
  }

  // prototype
  GiphyButton.prototype = {
    constructor: GiphyButton,
  };

  return GiphyButton;

})();