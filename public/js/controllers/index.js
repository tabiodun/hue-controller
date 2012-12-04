(function() {
  var table = $("#lights");
  if( table.length == 0 ) return;

  var light_schedules = {};
  var active_lights = {};

  function render_lights(lights) {
    var html = "";
    for( var id in lights ) {
      var light = lights[id];

      html += "<tr>";
      // STATE
      if( light.state.reachable ) {
        if( light.state.on ) {
          html += "<td class='center'><strong class='text-success'>On</strong></td>";
        } else {
          html += "<td class='center'><strong class='text-error'>Off</strong></td>";
        }
      } else {
        html += "<td class='center'><span class='text-error'>Offline</span></td>";
      }

      // NAME
      html += "<td>" + light.name + "</td>";

      // BRIGHTNESS
      var percent = (light.state.bri > HueData.bri.min ? (light.state.bri / HueData.bri.max) : 0) * 100;
      html += "<td class='center'>" + percent.toFixed(2) + "%</td>";

      // COLOR
      // Need to figure out how to represent the X/Y coords and color temps cleanly
      if( light.state.colormode == "xy" ) {
        html += "<td class='center'>X: <strong>" + light.state.xy[0] + "</strong>, Y: <strong>" + light.state.xy[1] + "</strong></td>";
      } else {
        html += "<td class='center'><div class='colorblock' style='background-color: " + Helper.light_color(light.state) + ";'></div></td>";
      }

      // ALERT
      if( light.state.alert == "none" ) {
        html += "<td class='center'>None</td>";
      } else if( light.state.alert == "select" ) {
        html += "<td class='center'>Single Flash</td>";
      } else if( light.state.alert == "lselect" ) {
        html += "<td class='center'>Repeated Flash</td>";
      }

      // Type
      html += "<td>" + light.type + "</td>";

      // Model ID
      html += "<td class='center'>" + light.modelid + "</td>";

      // CLEAR SCHEDULES
      if( light_schedules[id] && light_schedules[id] > 0 ) {
        html += "<td class='center'><a href='#' class='btn btn-mini btn-danger clear-schedules' data-light='" + id + "'>Clear " + light_schedules[id] + "</a></td>";
      } else {
        html += "<td class='center'><a href='#' class='btn btn-mini disabled'>Clear 0</a></td>";
      }

      // STATE
      html += "<td class='center'>";
      if( light.state.on ) {
        html += "<a href='#' class='btn btn-danger btn-mini toggle-light' data-state='false' data-light='" + id + "'>Off</a>";
      } else {
        html += "<a href='#' class='btn btn-success btn-mini toggle-light' data-state='true' data-light='" + id + "'>On</a>";
      }
      html += "</td>";

      html += "</tr>";
    }

    if( html == "" ) {
      html = "<tr><td colspan='9' class='center'><strong class='text-error'>No lights found</strong></td></tr>";
    }

    $("#lights tbody").html(html);
  }

  var loaded;
  function load_hub_data(onload) {
    if( !onload && $("#refresh-lights").hasClass("disabled") ) return;
    $("#refresh-lights").button("loading");

    Helper.request({
      success: function(data) {
        $("#refresh-lights").button("reset");

        // Keep track of # of schedules and IDs per light
        light_schedules = {};
        for( var key in data.schedules ) {
          var schedule = data.schedules[key];
          var light = schedule.command.address.match(/lights\/([0-9]+)\//);
          if( light && light[1] ) {
            light = light[1];
            if( !light_schedules[light] ) light_schedules[light] = [];
            light_schedules[light].push(key);
          }
        }

        // Keep track of reachable lights
        active_lights = {};
        for( var id in data.lights ) {
          if( data.lights[id].state.reachable ) {
            active_lights[id] = data.lights[id];
          }
        }

        if( !loaded ) {
          loaded = true;
          $("#lights-off, #lights-on").removeClass("disabled");
        }

        if( onload ) onload();

        // Render the display table
        render_lights(data.lights);
      }
    });
  }

  // Load initial data
  load_hub_data();

  // Refresh data
  $("#refresh-lights").click(function(event) {
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
  table.on("click", "a.clear-schedules", function(event) {
    event.preventDefault();
    if( $(this).hasClass("disabled") ) return;

    $(this).addClass("disabled");

    var schedules = light_schedules[$(this).data("light")];
    for( var i=0, total=schedules.length; i < total; i++ ) {
      requests.push(Helper.request({type: "DELETE", path: "schedules/" + schedules[i], success: function() {
        check_requests();
      }}));
    }
  });

  // Toggle a single light
  table.on("click", "a.toggle-light", function(event) {
    event.preventDefault();
    if( $(this).hasClass("disabled") ) return;

    $(this).addClass("disabled");

    Helper.request({
      type: "PUT",
      path: "lights/" + $(this).data("light") + "/state",
      data: {on: $(this).data("state")},
      complete: load_hub_data
   });
  });

  // Change the state on every light
  function update_all_lights(button, data) {
    if( button.hasClass("disabled") ) return;

    // Figure out which we need to change state on
    var lights = [];
    for( var id in active_lights ) {
      for( var key in data ) {
        if( active_lights[id].state[key] !== data[key] ) {
          lights.push(id);
          break;
        }
      }
    }

    // No lights to change
    if( lights.length == 0 ) return;

    button.button("loading");
    $(".container a").addClass("disabled");

    // Reset buttons once we're done
    function oncomplete() {
      $(".container a").removeClass("disabled");
      $("#lights-on, #lights-off").button("reset");
    }

    for( var i=0, total=lights.length; i < total; i++ ) {
      requests.push(Helper.request({type: "PUT", path: "lights/" + lights[i] + "/state", data: data, success: function() {
        check_requests(oncomplete);
      }}));
    }
  }

  $("#lights-on, #lights-off").click(function(event) {
    event.preventDefault();
    update_all_lights($(this), {on: $(this).data("state")});
  });
})();