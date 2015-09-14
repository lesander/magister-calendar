/**
 * Magister Calendar v1.4.0
 * https://git.io/magister
 *
 * Copyright 2015 Sander Laarhoven
 * Licensed under MIT (http://git.io/magister-calendar-license)
 */

var fs = require("fs");

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
  log: function(status, text, error) {
    if (status == "error") {
      var prefix = "!";
    }
    else {
      var prefix = "*";
    }
    var date = new Date();
    var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    var logtext = "[" + prefix + "] " + time + " " + text;
    if (error) {
      var logtext = logtext + " " + JSON.stringify(error);
    }
    console.log(logtext);
  },
  loadJSONfile: function(path) {
    var file;
    try {
      file = fs.readFileSync(path, "utf8");
    }
    catch (e) {
      if (e.code == "ENOENT") {
        module.exports.log("error", "Config file " + path + " not found.", e);
        process.exit(1);
      }
      else {
        module.exports.log("error", "An error occured when opening " + path + ".", e);
        throw e;
      }
    }
    if (!module.exports.validjson(file)) {
      module.exports.log("error", "File " + path + " contains bogus JSON.");
      process.exit(1);
    }
    return JSON.parse(file);
  },
  sendPushMessage: function(appointment) {
    // To be implemented..
    return;
  }
}
