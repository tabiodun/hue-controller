var Helper = {
  error: function(error) {
    $("#error").removeClass("hide").find("span").text(error);
  },

  field_error: function(field, text) {
    var group = $("#" + field).closest(".control-group");
    group.addClass("error");

    this.error(text);
  },

  reset_errors: function() {
    $(".control-group.error").removeClass("error");
    $("#error").addClass("hide");
  }
};