$(function() {

    // URL to get data once logged in. Will keep in LocalStorage
    var logURL = "";

    /* The list of events.
     * 
     * Considered a LinkedList but we don't worry about add/remove
     * in the middle of the list so an Array will do fine for now.
     * We don't need it to be an associative array, so use Array()
     * not Object() to initialize it.
     */
    var eventList = Array();

    // Customize BlockUI blocking screen
    $.blockUI.defaults.message = '<h3>Please wait...</h3>';
    $.blockUI.defaults.overlayCSS.opacity = 0.7;
    $.blockUI.defaults.css.border = 'none';
    $.blockUI.defaults.css.backgroundColor = '#000';
    $.blockUI.defaults.css.color = '#fff';
    $.blockUI.defaults.css.borderRadius = '10px';

    // Setup BlockUI: block while ajax is happening
    $(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);

    // Setup some defaults for date pickers; placeholder= and value= didn't work
    $('#dateinput_from').val( moment().subtract('days', 7).format('YYYY-MM-DD') );
    $('#dateinput_to').val( moment().format('YYYY-MM-DD') );

    $(document).ready(function () {

      /* Any time the app loads (from scratch, resuming, background, whatever):
       * 1. Try to retrieve logURL from LocalStorage
       * 2. Fire AJAX call to update events list with logURL
       * 
       * Possible outcomes:
       * 1. logURL is good and we're logged in ==> get updated table
       * 2. logURL old or not logged in ==> sent to login screen
       */
      console.log("main(): trying to get logURL from LocalStorage");
      var value = window.localStorage.getItem("logURL");
      if (value !== null && value !== "") {
        console.log("main() got logURL = " + value);
        logURL = value;
        getEvents();
        //location.href = '#page-events';
      }

      // Actions on events for all pages
      $('#button-submit').on('click', function() {
        loginAndGet();
      });
      $('#button-refresh').on('click', function() {
        getEvents();
      });
      $("#selectmenu").on('change', function() {
        buildEventList( $("#selectmenu").val() ); // apply filters
      });
      $('#button-apply-filters').on('click', function() {
        location.href = '#page-events'; // filters are already set
      });

    });

    function needToLogin( $jquery_page ) {
      return $jquery_page.filter("title").text().substr(0,6) == "Log in";
    }

    function loginAndGet() {
      $.ajax({
          type: "POST",
          url: "https://simplisafe.com/my-account/login",
          cache: false,
          data: {
            name: $('#text-email').val(), 
            pass: $('#text-pass').val(),
            form_id: 'user_login',
            op: 'Log in',
          },
      })
        .done(function( data ) {

          var $response = $(data); // make jQuery object

          if ( needToLogin($response) ) {
            // user/pass wrong
            console.log("loginAndGet(): user/pass wrong!");
          } else {
            var milliseconds = (new Date).getTime();
            logURL = $response.filter("link[rel='canonical']").attr('href')
              + '/utility/tables?_=' + milliseconds + '&&table=event-log-table';

            window.localStorage.setItem("logURL", logURL);
            console.log("login(): logged in and URL stored");

            // Call it here to prevent it from beng fired before we are logged in
            // I could probably use some onAjaxFired event thing
            getEvents();
          }
        })
        .fail(function( e ) {
          console.log( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }

    /*************************
     ******** EVENTS *********
     *************************/

    function getEventType( eventText ) {
      
      var ret = "unknown";
      var eventTypes = Object();

      // build an associative array of the type
      // { 'Armed' : 'armed', 'Error' : 'error' }
      // from the <select> in index.html
      $('#selectmenu option').each( function() {
        if ( $(this).text() !== 'All' )
          eventTypes[ $(this).text() ] = $(this).val();
      });

      // find out which one eventText contains
      for (var e in eventTypes) {
        if (eventText.indexOf(e) !== -1)
          ret = eventTypes[e];
      }

      return ret;
    }

    function convertTableToList( $jQueryTable ) {

      // jQuery filter() – search through all the elements.
      // jQuery find() – search through all the child elements only.
      // for each row, get [date, time, event] and store in Array
      // this performs in cuadratic time
      eventList = []; // empty it first
      $jQueryTable.find('tr[class]').each( function() {
        eventList.push({
          'date' : this.cells[0].innerText,
          'time' : this.cells[1].innerText,
          'event' : this.cells[2].innerText,
          'type' : getEventType(this.cells[2].innerText),
        });
      });

      console.log("convertTableToList(): eventList.length = " + eventList.length);;
    }

    function buildEventList( typeFilter ) {
      
      $("#event-list").empty();
      
      for(var i = 0; i < eventList.length; i++) {
        if (eventList[i]['type'] === typeFilter || typeFilter === 'all') {
          $("#event-list").append(
            '<li>' + '<h3>' 
            + eventList[i]['date'] + ' @' 
            + eventList[i]['time'] + '</h3>' 
            + '<p>' + eventList[i]['event'] + '</p>' + '</li>'
          );
        }
      }

      if ( typeFilter !== 'all' && $("#event-list li").length == 0 ) {
        $("#event-list").append('<h3>Nothing here :( try with another type</h3>');
      }

      // Apply jQuery Mobile's CSS rendering, since DOM has already been built
      // http://stackoverflow.com/a/13694211/251509
      // Also, refresh it only if it's ready, to avoid initialization error:
      // http://stackoverflow.com/q/10373618/251509
      if ( $('#event-list').hasClass('ui-listview') )
        $('#event-list').listview('refresh');
    }

    function getEvents() {
      $.ajax({
          type: "GET",
          url: logURL,
          cache: false,
      })
        .done(function( data ) {

          var $response = $(data);

          if ( needToLogin($response) ) {
            // send to login page, with a message
            location.href = "#page-login";
            console.log("getEvents(): not logged in!");
          } else {
            var $table = $('<table>'
              + $response.filter('table').html() + '</table>');
            // from <table> to Array()
            convertTableToList($table);

            // build and refresh event list as ListView
            buildEventList('all');

            // and go to see the list, in case we're not there
            console.log("getEvents(): table loaded");
            location.href = "#page-events";
          }
        })
        .fail(function( e ) {
          console.log( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }
});
