/**
 * Magister Calendar v1.0.0
 * https://git.io/magister
 *
 * Copyright 2015 Sander Laarhoven
 * Licensed under MIT (http://git.io/magister-calendar-license)
 */


module.exports = {
  validjson: function (string) {
    try {
      JSON.parse(string);
    }
    catch (e) {
      return false;
    }
    return true;
  },
  log: function(status, text) {
    if (status == "error") {
      var prefix = "!";
    }
    else {
      var prefix = "*";
    }
    var date = new Date();
    var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    console.log("[" + prefix + "] " + time + " " + text);
  }
}
