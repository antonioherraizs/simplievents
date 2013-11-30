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
        $('#button-submit').on('click', function(e) {
          
          loginAndGet();
          location.href = "#page-events";

        });

        $('#button-refresh').on('click', function(e) {

          if (!loggedIn) {
            console.log("main(): not logged in when it should be!");
            loginAndGet();
          }
          getEvents();

        });
    });

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

          var milliseconds = (new Date).getTime();
          var $r = $(data);
          logURL = $r.filter("link[rel='canonical']").attr('href') + '/utility/tables?_=' + milliseconds + '&&table=event-log-table';
          console.log("login(): loggedIn = true");
          loggedIn = true;

          // call it here to prevent it from beng fired before we are logged in
          getEvents();
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
          var table = $response.filter('table').html();
          $('#html5-block').html( "<table>" + table + "</table>" );
          $('#html5-block a').remove();
          $('#html5-block tr').removeClass();

          // bootstrap3 table styling
          $('#html5-block table').attr('class', 'table table-bordered table-condensed table-striped');
          console.log("getEvents(): table reloaded");
        })
        .fail(function( e ) {
          console.log( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }
});
