$("form").submit(function(event) {
  event.preventDefault();

  Helper.reset_errors();

  var ip = $.trim($("#ip").val());
  if( ip == "" ) {
    return Helper.field_error("ip", "Please enter an IP");
  }

  var name = $.trim($("#devicetype").val());
  if( name == "" ) {
    return Helper.field_error("devicetype", "Please enter a name");
  }

  $(this).find("input[type='submit']").button("loading");

  var scope = $(this);
  var post_data = function() {
    $.ajax(scope.attr("action"), {
      type: "POST",
      data: {username: $("#username").val(), ip: ip, devicetype: name},
      error: function(res) {
        if( res.responseText == "waiting" ) {
          $("#auth-modal").modal({backdrop: "static", keyboard: false});

          setTimeout(post_data, 2000);
        } else {
          Helper.error(res.responseText);

          scope.find("input[type='submit']").button("reset");
          $("#auth-modal").modal("hide");
        }
      },
      success: function() {
        $("#auth-modal").modal("hide");
        window.location = "/";
      }
    });
  };

  post_data();
});