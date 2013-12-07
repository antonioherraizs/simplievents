$(function() {

    var logURL = "";

    // Customize BlockUI blocking screen
    $.blockUI.defaults.message = '<h3>Please wait...</h3>';
    $.blockUI.defaults.overlayCSS.opacity = 0.7;
    $.blockUI.defaults.css = {}; // use our CSS file instead

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

      $('#button-submit').on('click', function() {
        loginAndGet();
      });

      $('#button-refresh').on('click', function() {
        getEvents();
      });
    });

    function amILoggedIn( $jquery_page ) {
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

          var $response = $(data);

          if ( amILoggedIn($response) ) {
            // user/pass wrong
            console.log("loginAndGet(): user/pass wrong!");
          } else {
            var milliseconds = (new Date).getTime();
            logURL = $response.filter("link[rel='canonical']").attr('href')
              + '/utility/tables?_=' + milliseconds + '&&table=event-log-table';

            window.localStorage.setItem("logURL", logURL);
            console.log("login(): logged in and URL stored");

            // call it here to prevent it from beng fired before we are logged in
            getEvents();
          }
        })
        .fail(function( e ) {
          console.log( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }

    function convertTableToList( $jQueryTable ) {
      /* Considered a LinkedList but we don't worry about add/remove
       * in the middle of the list so an Array will do fine for now.
       * We don't need it to be an associative array, so use Array()
       * not Objecct() to initialize it.
       */
      var list = Array();

      // make a proper jQuery object so I can use find() ???
      //$table = $($.parseHTML( $jQueryTable.html() ));
      
      // for each row, get [date, time, event] and store in Array
      $jQueryTable.find('tr[class]').each( function() {
        list.push({
          'date' : this.cells[0].innerText,
          'time' : this.cells[1].innerText,
          'event' : this.cells[2].innerText,
        });
      });

      console.log("convert(): " + list);
      return list;
    }

    function getEvents() {
      $.ajax({
          type: "GET",
          url: logURL,
          cache: false,
      })
        .done(function( data ) {

          var $response = $(data);

          if ( amILoggedIn($response) ) {
            // send to login page, with a message
            location.href = "#page-login";
            console.log("getEvents(): not logged in!");
          } else {
            var $table = $('<table>'
              + $response.filter('table').html() + '</table>');
            var list = convertTableToList($table);

            // build event list
            $("#event-list").empty();
            for(var i = 0; i < list.length; i++) {
              $("#event-list").append(
                '<li>' +
                '<h3>' + list[i]['date'] + ' @' + list[i]['time'] + '</h3>' +
                '<p>' + list[i]['event'] + '</p>' +
                '</li>'
              );
            }
            // Apply jQuery Mobile's CSS rendering, since DOM has already been built
            // http://stackoverflow.com/a/13694211/251509
            // Also, refresh it only if it's ready, to avoid initialization error:
            // http://stackoverflow.com/q/10373618/251509
            if ( $('#event-list').hasClass('ui-listview') )
              $('#event-list').listview('refresh');

            // and go to see the log, in case we're not there
            console.log("getEvents(): table reloaded");
            location.href = "#page-events";
          }
        })
        .fail(function( e ) {
          console.log( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }
});
