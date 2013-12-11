/* 
    SimpliEvents - A event viewer for users of the SimpliSafe alarm system.
    Copyright (C) 2013 Antonio Herraiz Sousa

    'SimpliSafe' is a registered trademark of SimpliSafe, Inc.

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

$(function() {

    /* URL to get data once logged in.
     * Will keep in LocalStorage.
     */
      
    var logURL = "";

    /* The list of events.
     * 
     * Considered a LinkedList but we don't worry about add/remove
     * in the middle of the list so an Array will do fine for now.
     * We don't need it to be an associative array, so use Array()
     * not Object() to initialize it.
     */
    var eventList = Array();

    // Setup some defaults for date pickers; placeholder= isn't supported for dates
    function setDefaultDateFilter() {
      $('#dateinput_from').val( moment().subtract('days', 7).format('YYYY-MM-DD') );
      $('#dateinput_to').val( moment().format('YYYY-MM-DD') );
    }
    setDefaultDateFilter();

    /* Filter for event type.
     * Make it available to multiple functions.
     */ 
    var eventFilter = {
      'type' : 'all',
      'dateFrom' : $('#dateinput_from').val(),
      'dateTo' : $('#dateinput_to').val(),
    }

    // Customize BlockUI blocking screen
    $.blockUI.defaults.message = '<h3>Please wait...</h3>';
    $.blockUI.defaults.overlayCSS.opacity = 0.7;
    $.blockUI.defaults.css.border = 'none';
    $.blockUI.defaults.css.backgroundColor = '#000';
    $.blockUI.defaults.css.color = '#fff';
    $.blockUI.defaults.css.borderRadius = '10px';

    // Setup BlockUI: block while ajax is happening
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

      // Actions on events for all pages
      $('#button-submit').on('click', function() {
        loginAndGet();
      });
      $('#button-refresh').on('click', function() {
        getEvents();
      });
      $('#button-logout').on('click', function() {
        logout();
      });
      $("#selectmenu").on('change', function() {
        eventFilter['type'] = $("#selectmenu").val();
      });
      $('#dateinput_from').on('change', function() {
        eventFilter['dateFrom'] = $('#dateinput_from').val();
      });
      $('#dateinput_to').on('change', function() {
        eventFilter['dateTo'] = $('#dateinput_to').val();
      });
      $('#button-apply-filters').on('click', function() {
        buildEventList(); // apply filters
        location.href = '#page-events';
      });
      $('#button-reset-dates').on('click', function() {
        setDefaultDateFilter();
        eventFilter['dateFrom'] = $('#dateinput_from').val();
        eventFilter['dateTo'] = $('#dateinput_to').val();
      });

    });

    function needToLogin( $jquery_page ) {
      return $jquery_page.filter("title").text().substr(0,6) == "Log in";
    }

    function loginAndGet() {
      $.ajax({
          type: "POST",
          url: "https://simplisafe.com/my-account/login",
          timeout: 20000,
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
            $('#text-feedback').html('<p>User/password wrong, please try again</p>');
            console.log("loginAndGet(): user/pass wrong!");
          } else {
            $('#text-feedback').empty();

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
        .fail(function( jqXHR, textStatus, errorThrown ) {
          console.log( "Error " + errorThrown + ": " + textStatus );
        });
    }

    function logout() {
      $.ajax({
          type: "GET",
          url: "https://simplisafe.com/logout",
          cache: false,
      }) 
        .done(function( data ) {
          $('#text-feedback').html('<p>Please log in to continue</p>');
          $('#text-email').val("");
          $('#text-pass').val("");
          location.href = "#page-login";
        })
        .fail(function( jqXHR, textStatus, errorThrown ) {
          console.log( "Error " + errorThrown + ": " + textStatus );
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

      console.log("convertTableToList(): " + eventList.length + " events");
    }

    function buildEventList() {

      /* Build the list of events with the filter passed as a parameter.
       *
       * The filter can be for event types or a date range.
       * A date range may have empty from/to dates: ignore them in that case.
       * We work with what we have, we will not get older events from here.
       */

      $("#event-list").empty();

      // let's see if we have a date range
      var useDateFilter = false;
      if ( moment(eventFilter['dateTo']).isAfter(eventFilter['dateFrom']) ||
           moment(eventFilter['dateTo']).isSame(eventFilter['dateFrom']) ) {
        useDateFilter = true;
      }
      
      var appendIt = false;
      for(var i = 0; i < eventList.length; i++) {
        if (eventList[i]['type'] == eventFilter['type'] || eventFilter['type'] == 'all') {
          if (useDateFilter) {
            var from = moment(eventFilter['dateFrom']).unix();
            var filter = moment(eventList[i]['date']).unix();
            var to = moment(eventFilter['dateTo']).unix();
            if (from <= filter && filter <= to) {
              appendIt = true;
            }
          }
          else {
            // no date filter in use and type filter matches
            appendIt = true;
          }
        }
        if (appendIt == true) {
          $("#event-list").append(
            '<li>' + '<h3>'
            + eventList[i]['date'] + ' @'
            + eventList[i]['time'] + '</h3>' 
            + '<p>' + eventList[i]['event'] + '</p>' + '</li>'
          );
          appendIt = false;
        }
      }

      if ($("#event-list li").length == 0) {
        if (eventFilter['type'] !== 'all' || useDateFilter)
          $("#event-list")
            .append("<h3 class='centered'>Nothing here " 
              + ":( try with another filter</h3>");
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
            $('#text-feedback').html('<p>Please log in to continue</p>');
            console.log("getEvents(): not logged in!");
            location.href = "#page-login";
          } else {
            var $table = $('<table>'
              + $response.filter('table').html() + '</table>');
            // from <table> to Array()
            convertTableToList($table);

            // build and refresh event list as ListView
            buildEventList();

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
