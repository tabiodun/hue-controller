(function() {
  var schedule_ids = [];

  function render_schedules(schedules) {
    var html = "";
    for( var id in schedules ) {
      var schedule = schedules[id];
      schedule_ids.push(id);

      var light = schedule.command.address.match(/lights\/([0-9]+)\//);
      if( light && light[1] ) {
        light = light[1];
      } else {
        light = null;
      }

      html += "<tr>";

      // NAME
      html += "<td>" + schedule.name + "</td>";

      // RUN AT
      var time = new Date(schedule.time);
      // Stored as UTC, so need to convert it to local time
      time = new Date(time.valueOf() + (time.getTimezoneOffset() * 60));

      html += "<td>" + time.toLocaleString() + "</td>";

      // LIGHT
      html += "<td class='center'>" + (light || "---") + "</td>";

      // STATE
      if( typeof(schedule.command.body.on) == "boolean" ) {
        html += "<td class='center'>";

        if( schedule.command.body.on ) {
          html += "<span class='text-error'>On</span>";
        } else {
          html += "<span class='text-error'>Off</span>";
        }

        html += "</td>";

      } else {
        html += "<td class='center'>No Change</td>";
      }

      // BRIGHTNESS
      if( typeof(schedule.command.body.bri) == "number" ) {
        var percent = (schedule.command.body.bri > HueData.bri.min ? (schedule.command.body.bri / HueData.bri.max) : 0) * 100;
        html += "<td class='center'>" + percent.toFixed(2) + "%</td>";
      } else {
        html += "<td class='center'>No Change</td>";
      }

      // COLOR
      html += "<td class='center'>"
      // X/Y
      if( typeof(schedule.command.body.xy) == "object" ) {
        html += "X: <strong>" + schedule.command.body.xy[0] + "</strong>, Y: <strong>" + schedule.command.body.xy[1] + "</strong>";

      // Color Temperature
      } else if( typeof(schedule.command.body.ct) == "number" ) {
        schedule.command.body.colormode = "ct";
        html += "<div class='colorblock' style='background-color: " + Helper.light_color(schedule.command.body) + ";'></div>";

      // Hue
      } else if( typeof(schedule.command.body.hue) == "number" ) {
        if( !schedule.command.body.sat ) schedule.command.body.sat = HueData.sat.max;
        if( !schedule.command.body.bri ) schedule.command.body.bri = HueData.bri.max;
        schedule.command.body.colormode = "hs";

        html += "<div class='colorblock' style='background-color: " + Helper.light_color(schedule.command.body) + ";'></div>";

      // Brightness only
      } else if( typeof(schedule.command.body.sat) == "number" ) {
        html += "Sat: <strong>" + schedule.command.body.sat;

      // Nadda
      } else {
        html += "No Change";
      }
      html += "</td>";


      html += "<td class='center'><a href='#' class='btn btn-mini btn-danger clear-schedules' data-schedule='" + id + "'>Delete</a></td>";

      html += "</tr>";
    }

    if( html == "" ) {
      html = "<tr><td colspan='7' class='center'><strong class='text-error'>No scheduled events found</strong></td></tr>";
    }

    $("#schedules tbody").html(html);
  }

  var loaded;
  function load_hub_data(onload) {
    if( !onload && $("#refresh-data").hasClass("disabled") ) return;
    $("#refresh-data").button("loading");

    Helper.request({
      success: function(data) {
        $("#refresh-data").button("reset");

        if( !loaded ) {
          loaded = true;
          $("#clear-schedules").removeClass("disabled");
        }

        if( onload ) onload();

        // Render the display table
        render_schedules(data.schedules);
      }
    });
  }

  // Load initial data
  load_hub_data();

  // Refresh data
  $("#refresh-data").click(function(event) {
    event.preventDefault();
    load_hub_data();
  });

  // Check if all of our requests finished
  var requests = [];
  function check_requests(oncomplete) {
    var has_active;
    for( var i=0, total=requests.length; i < total; i++ ) {
      if( requests[i].readyState != 4 ) {
        has_active = true;
        break;
      }
    }

    if( !has_active ) {
      requests = [];
      load_hub_data(oncomplete);
    }
  }

  // Clear scheduled jobs
  $("#schedules").on("click", "a.clear-schedules", function(event) {
    event.preventDefault();
    if( $(this).hasClass("disabled") ) return;

    $(this).addClass("disabled");

    Helper.request({type: "DELETE", path: "schedules/" + $(this).data("schedule"), success: function() {
      load_hub_data();
    }});
  });

  $("#clear-schedules").click(function(event) {
    event.preventDefault();
    if( $(this).hasClass("disabled") ) return;
    if( !confirm("Are you sure?") ) return;

    $(this).button("loading");
    $(".container a").addClass("disabled");

    // Reset after we're done
    function oncomplete() {
      $(".container a").removeClass("disabled");
      $("#clear-schedules").button("reset");
    }

    function success() { check_requests(oncomplete); }

    for( var i=0, total=schedule_ids.length; i < total; i++ ) {
      requests.push(Helper.request({type: "DELETE", path: "schedules/" + schedule_ids[i], success: success}));
    }
  });
})();