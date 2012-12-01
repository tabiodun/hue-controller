var Helper = {
  error: function(error) {
    $("#error").removeClass("hide").find("span").html(error);
  },

  field_error: function(field, text) {
    var group = $("#" + field).closest(".control-group");
    group.addClass("error");

    if( group.find(".help-inline").length == 1 ) {
      var help = group.find(".help-inline");
      help.text(text);
    } else {
      this.error(text);
    }
  },

  reset_errors: function() {
    $(".control-group.error").removeClass("error");
    $("#error").addClass("hide");
  },

  reset_queue: function() {
    this.request_queue = [];
  },

  queue_request: function(args) {
    this.request_queue.push(args);
  },

  schedule_or_run: function(name, time, args) {
    if( time > Date.now() ) {
      var light = args.light;
      delete(args.light);
      var address = "/api/" + hub_info.apikey + "/lights/" + light + "/state";

      return {path: "schedules", type: "POST", data: {name: name, time: time.toISOString(), command: {method: "PUT", address: address, body: args}}};

    } else {
      var light = args.light;
      delete(args.light);
      return {path: "lights/" + light + "/state", type: "PUT", data: args};
    }
  },

  process_queue: function(status, oncomplete, onerror) {
    var offset = 0, max_offset = this.request_queue.length;
    var scope = this;

    var send_request = function() {
      var args = $.extend(scope.schedule_or_run(scope.request_queue[offset][0], scope.request_queue[offset][1], scope.request_queue[offset][2]), {
        success: function(res) {
          // Make sure our request succeeded
          var errors = [];
          for( var i= 0, total=res.length; i < total; i++ ) {
            if( res[i].error ) {
              errors.push(res[i].error.description + " (address: " + res[i].error.address + ")");
            }
          }

          if( errors.length > 0 ) {
            scope.error(errors.join("<br>"));
            onerror();
            return;
          }

          status.text("Processed " + offset + " of " + max_offset);
          offset += 1;

          // Done
          if( offset >= max_offset ) {
            return oncomplete();
          }

          // Process the next request
          send_request();
        }
      });

      // Send it off
      scope.request(args);
    };

    // Start processing
    send_request();
  },

  request: function(args) {
    var url = "http://" + hub_info.ip + "/api/" + hub_info.apikey;
    if( args.path ) {
      url += "/" + args.path;
      delete(args.path);
    }

    if( args.data && typeof(args.data) == "object" ) {
      args.data = JSON.stringify(args.data);
    }

    $.ajax(url, args);
  }
};