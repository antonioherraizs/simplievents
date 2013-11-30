$(function() {
    $(document).ready(function () {
        $('#button-submit').on('click', function(e) {
          e.preventDefault();

          login();
          //get_events();

          $('#html5-block').html("<table border='1'><tr><td>row 1, cell 1</td><td>row 1, cell 2</td></tr><tr><td>row 2, cell 1</td><td>row 2, cell 2</td></tr></table>");
          location.href = "#page-events";
        });
        //$('.login-form').on('click', '#get-button', get_test);
    });

    var milliseconds = 0;
    var logURL = "";

    function login() {
      $.ajax({
          type: "POST",
          url: "https://simplisafe.com/my-account/login",
          cache: false,
          //crossDomain: true, // don't need it for PhoneGap apps
          data: {
            name: $('#text-email').val(), 
            pass: $('#text-pass').val(),
            form_id: 'user_login',
            op: 'Log in',
          },
      })
        .done(function( data ) {
          //alert( "success" );
          alert(data.slice( 0, 100 ));
          if ( console && console.log ) {
            console.log( "returned POST:", data );
          }
          $('#text-output').empty();
          $('#text-output').text("<p>" + data + "</p>");

          milliseconds = (new Date).getTime();
          if (data.d) { data = data.d }
          alert(data);
          var $r = $(data);
          logURL = $r.filter("link[rel='canonical']").attr('href') + '/utility/tables?_=' + milliseconds + '&&table=event-log-table';
          alert(logURL);
        })
        .fail(function( e ) {
          alert( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }

    function get_test() {
      alert(logURL);
      $.ajax({
          type: "GET",
          url: logURL,
          cache: false,
      })
        .done(function( data ) {
          //alert( "success" );
          // alert(data.slice( 0, 100 ));
          // if ( console && console.log ) {
          //   console.log( "returned GET:", data );
          // }
          // create jQuery object from the response HTML
          if (data.d) { data = data.d }
          alert(data);
          var $response = $(data);

          var table = $response.filter('table').html();
          alert(table);
        })
        .fail(function( e ) {
          alert( "Error " + e.responseStatus + ": " + e.responseText );
        });
    }
});
