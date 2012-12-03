(function() {
  $("form").submit(function(event) {
    event.preventDefault();

    Helper.reset_errors();

    var ip = $.trim($("#ip").val());
    if( ip == "" ) {
      return Helper.field_error("ip", "Please enter an IP");
    }

    $(this).find("input[type='submit']").button("loading");

    var scope = $(this);
    $.ajax(scope.attr("action"), {
      type: "PUT",
      data: {ip: ip},
      error: function(res) {
        Helper.error(res.responseText);
        scope.find("input[type='submit']").button("reset");
      },
      success: function() {
        $("#info").removeClass("hide").html("<strong>Updated!</strong>");
        scope.find("input[type='submit']").button("reset");
      }
    });
  });
})();