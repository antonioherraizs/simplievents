$(function() {

    var logURL = "";
    var loggedIn = false;

    // customize BlockUI blocking screen
    $.blockUI.defaults.message = '<h3>Please wait...</h3>';
    $.blockUI.defaults.overlayCSS.opacity = 0.7;
    $.blockUI.defaults.css = {}; // use our CSS file instead

    // block while ajax is happening
    $(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);

    $(document).ready(function () {

      console.log('main(): loggedIn = ' + loggedIn);
      console.log('main(): cookies = ' + document.cookies);

      // If value was stored, maybe cookies are still valid?
      if (loggedIn) {
        console.log('main(): already logged in, just refresh');
        getEvents();
        location.href = "#page-events";
      }

      $('#button-submit').on('click', function(e) {
        
        loginAndGet();

      });

      $('#button-refresh').on('click', function(e) {

        if (!loggedIn) {
          console.log("main(): not logged in when it should be!");
          loginAndGet();
        }
        getEvents();

      });
    });

    function gotLoginPage( jquery_page ) {
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

          if ( gotLoginPage($response) ) {
            // user/pass wrong
            console.log("loginAndGet(): user/pass wrong!");
            loggedIn = false;
          } else {
            var milliseconds = (new Date).getTime();
            logURL = $response.filter("link[rel='canonical']").attr('href')
              + '/utility/tables?_=' + milliseconds + '&&table=event-log-table';
            console.log("login(): loggedIn = true");
            loggedIn = true;

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

          if ( gotLoginPage($response) ) {
            // send to login page, with a message
            location.href = "#page-login";
            console.log("getEvents(): not logged in! changed pass?");
            loggedIn = false;
          } else {
            var table = $response.filter('table').html();
            $('#html5-block').empty();
            $('#html5-block').html( "<table>" + table + "</table>" );
            $('#html5-block a').remove();
            $('#html5-block tr').removeClass();

            // bootstrap3 table styling
            $('#html5-block table')
              .attr('class', 'table table-bordered table-condensed table-striped');
            console.log("getEvents(): table reloaded");

            // and go to see the log, in case we're not there
            location.href = "#page-events";
          }
        })
        .fail(function( e ) {
          console.log( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }
});
