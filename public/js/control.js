(function() {
  $(".tabbable ul li a").click(function(event) {
      event.preventDefault();
      $(this).tab("show");
    });

  Helper.request({
    path: "lights",
    type: "GET",
    success: function(lights) {
      var html = "";
      for( var key in lights ) {
        html += "<option value='" + key + "'>" + lights[key].name + "</option>";
      }

      if( html != "" ) {
        $("#job_lights").html(html).attr("disabled", null);
        $("form input[type='submit']").attr("disabled", false);

      } else {
        $("form input[type='submit']").val("No Lights Found");
      }
    }
  });

  function pad(number) {
    if( number < 10 ) {
      return "0" + number
    } else {
      return number;
    }
  }

  function format_command(data) {
    var cmd = {};
    cmd.on = data.on;
    if( typeof(data.transitiontime) == "number" ) cmd.transitiontime = data.transitiontime;
    if( typeof(data.bri) == "number" ) cmd.bri = data.bri;

    // If the lights are off, no sense in pushing the rest
    if( cmd.on == false ) return cmd;

    if( typeof(data.alert) == "string" ) cmd.alert = data.alert;

    if( typeof(data.ct) == "number" ) {
      cmd.ct = data.ct;

    } else {
      if( typeof(data.hue) == "number" ) cmd.hue = data.hue;
      if( typeof(data.sat) == "number" ) cmd.sat = data.sat;
    }

    return cmd;
  }

  function format_time(time) {
    return time.getUTCFullYear() + "-" + pad(time.getUTCMonth() + 1) + "-" + pad(time.getUTCDate()) + "T" + pad(time.getUTCHours()) + ":" + pad(time.getUTCMinutes()) + ":" + pad(time.getUTCSeconds());
  }

  function schedule_or_run(name, time, args) {
    if( time > Date.now() ) {
      var light = args.light;
      delete(args.light);
      args.method = "PUT";
      args.address = "/api/" + hub_info.apikey + "/lights/" + light + "/state";

      return {path: "schedules", type: "POST", data: {name: name, time: format_time(time), command: args}};

    } else {
      var light = args.light;
      delete(args.light);
      return {path: "lights/" + light + "/state", type: "PUT", data: args};
    }
  }

  $("form").submit(function(event) {
    event.preventDefault();
    Helper.reset_errors();

    // Parse the data for sanity
    var data = {}, errors = false;
    $("form").find("input[type='number'], input[type='text'], select").each(function() {
      var row = $(this);
      var key = row.attr("id").replace("job_", "");
      var val = row.val();
      if( val == "" ) return;

      if( row.attr("type") == "number" ) {
        var min = row.attr("min"), max = row.attr("max");
        val = parseInt(val);

        if( val < min ) {
          Helper.field_error(row.attr("id"), "cannot be below " + min);
          errors = true;
        } else if( val > max ) {
          Helper.field_error(row.attr("id"), "cannot be above " + max);
          errors = true;
        }
      } else if( val == "true" ) {
        val = true;
      } else if( val == "false" ) {
        val = false;
      }

      data[key] = val;
    });

    if( !data.lights || typeof(data.lights) != "object" || data.lights.length == 0 ) {
      return Helper.field_error("job_lights", "no lights selected");
    }

    if( errors == true ) return;
    $(this).find("input[type='submit']").button("loading");
    $("#progress-modal").modal({backdrop: "static", keyboard: false});

    // Figure out the date to schedule (if any)
    var hours = parseInt(data["start_hours"]);
    if( data["start_meridian"] == "pm" ) {
      hours = hours == 12 ? 0 : (hours + 12);
    }

    var time = new Date(data["start_year"], parseInt(data["start_month"]) - 1, data["start_day"], hours, data["start_minutes"], data["start_seconds"]);

    // Figure out how many commands will be pushing
    Helper.reset_queue();

    if( !data.name ) data.name = "Job";

    // Reset all the other lights this isn't effecting
    if( data.reset == true ) {
      var inactive_lights = {};
      $("#job_lights option").each(function() {
        inactive_lights[$(this).val()] = true;
      });

      for( var i=0, total=data.lights.length; i < total; i++ ) {
        delete(inactive_lights[data.lights[i]]);
      }

      for( var light in inactive_lights ) {
        Helper.queue_request(schedule_or_run(data.name + ": Reset Light " + light, time, {on: false, light: light}));
      }
    }

    var offset = 0;
    // Convert into milliseconds since that's what dates are done in in Javascript
    data.interval *= 1000;

    // Schedule primary jobs
    for( var i=0; i < data.maxruns; i++ ) {
      for( var j=0, total=data.lights.length; j < total; j++ ) {
        var interval_time = time ? new Date(time.valueOf() + offset) : null;
        var cmd = format_command(data);
        cmd.light = data.lights[j];

        Helper.queue_request(schedule_or_run(data.name + ": Run " + i + ", Light " + j, interval_time, cmd));
      }

      offset += data.interval;
    }

    Helper.process_queue($("#progress-modal .status"), function() {
      var modal = $("#progress-modal");
      modal.find(".modal-header h3").text("Completed");
      modal.find(".modal-body p").addClass("text-success").text("Finished queuing jobs!");
      modal.find(".modal-footer").html("<a href='/schedules' class='btn'>View Schedule</a><a href='/control' class='btn btn-inverse'>Queue another job</a>");
    }, function() { $("#progress-modal").modal("hide"); });
  });
})();