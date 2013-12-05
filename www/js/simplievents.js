$(function() {

    var logURL = "";

    // customize BlockUI blocking screen
    $.blockUI.defaults.message = '<h3>Please wait...</h3>';
    $.blockUI.defaults.overlayCSS.opacity = 0.7;
    $.blockUI.defaults.css = {}; // use our CSS file instead

    // block while ajax is happening
    $(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);

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
      }

      $('#button-submit').on('click', function(e) {
        loginAndGet();
      });

      $('#button-refresh').on('click', function(e) {
        getEvents();
      });
    });

    function amILoggedIn( jquery_page ) {
      return jquery_page.filter("title").text().substr(0,6) == "Log in";
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
            var table = $response.filter('table').html();
            $('#html5-block').empty();
            $('#html5-block').html( "<table>" + table + "</table>" );

            // remove unnecessary elements
            $('#html5-block a').remove();
            $('#html5-block tr').removeClass();

            // remove word 'System ' from table rows
            $('#html5-block table td:contains("System ")').each(function(){
              $(this).text( $(this).text().replace(/System /g, '') );
            });

            // bootstrap3 table styling
            $('#html5-block table')
              .attr('class', 'table table-bordered table-condensed table-striped');

            // My own styling
            $('table tr td:nth-child(1)').css("font-size", "smaller"); // Date column
            $('table tr td:nth-child(2)').css("font-size", "smaller"); // Time column

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
