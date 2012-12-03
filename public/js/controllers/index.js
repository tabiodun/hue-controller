(function() {
  var table = $("#lights");
  if( table.length == 0 ) return;

  var light_schedules = {};

  function render_lights(lights) {
    $("#lights tbody tr").remove();

    var html = "";
    for( var id in lights ) {
      var light = lights[id];
      console.log(light);

      html += "<tr>";
      // STATE
      if( light.state.reachable ) {
        if( light.state.on ) {
          html += "<td><strong class='text-success'>On</strong></td>";
        } else {
          html += "<td><strong class='text-error'>Off</strong></td>";
        }
      } else {
        html += "<td><span class='text-error'>Offline</span></td>";
      }

      // NAME
      html += "<td>" + light.name + "</td>";

      // BRIGHTNESS
      var percent = (light.state.bri > hue.bri.min ? (light.state.bri / hue.bri.max) : 0) * 100;
      html += "<td>" + percent.toFixed(2) + "%</td>";

      // COLOR
      // Need to figure out how to represent the X/Y coords and color temps cleanly
      if( light.state.colormode == "xy" ) {
        html += "<td> X: <strong>" + light.state.xy[0] + "</strong>, Y: <strong>" + light.state.xy[1] + "</strong></td>";
      } else {
        var hex;
        if( light.state.colormode == "ct" ) {
          hex = Helper.ct_to_rgb(light.state.ct);
        }

        html += "<td><div class='colorblock' style='background-color: " + hex + "'></div></td>";
      }

      // ALERT
      if( light.state.)

      // Type

      // Model ID

      // NUMBER OF SCHEDULES

      // CLEAR SCHEDULES

      // STATE

      html += "</tr>";
    }

    $("#lights tbody").html(html);
  }

  function load_lights() {
    if( $("#refresh-lights").hasClass("disabled") ) return;
    $("#refresh-lights").button("loading");

    Helper.request({
      success: function(data) {
        $("#refresh-lights").button("reset");

        light_schedules = {};
        for( var key in data.schedules ) {
          var schedule = data.schedules[key];
          var light = schedule.command.address.match(/lights\/([0-9]+)\//);
          if( !light_schedules[light] ) light_schedules[light] = [];
          light_schedules[light].push(key);
        }

        render_lights(data.lights);
      }
    });
  }


  load_lights();

  $("#refresh-lights").click(function(event) {
    event.preventDefault();
    load_lights();
  });
})();