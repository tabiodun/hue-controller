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
        error: function(res, textStatus, error) {
          var text = "Failed to send request: " + textStatus;
          if( typeof(error) == "string" && error != "" ) text += " (" + text + ")";
          scope.error(text + "<p>Please reload the page and try again.</p>");
          onerror();
        },

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

    if( !args.error ) {
      args.error = function(res, textStatus, error) {
        if( res.readyState == 0 ) return;

        var text = "Failed to send request: " + textStatus;
        if( typeof(error) == "string" && error != "" ) text += " (" + text + ")";
        $("#info").removeClass("hide").removeClass("alert-info").addClass("alert-error").html("<strong>" + text + "</strong>");
      };
    }

    return $.ajax(url, args);
  },

  ct_to_rgb: function(ct) {
    // We have a table based on 100s and it's probably not necessary to have accuracy below that anyway.
    // so we need to convert whatever value we have into a number rounded to the hundreds.
    ct = Math.floor((1000000 / ct) / 100) * 100;
    return this.DATA.ct[ct.toString()];
  },

  // These functions were grabbed from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
  // so credit to him for the implementation.
  rgb_to_hsl: function(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
  },
};