/**
 * Magister Calendar v1.8.0
 * https://git.io/magister
 *
 * Copyright 2015 Sander Laarhoven
 * Licensed under MIT (http://git.io/magister-calendar-license)
 */

var fs = require("fs");
var request = require("request");
var LOG_HISTORY = "";

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
    if (status == "error" || status == "critical") {
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
    LOG_HISTORY += logtext + "\n";
    console.log(logtext);
    if (status == "critical") {
      module.exports.crashReport(LOG_HISTORY);
    }
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
  sendPushMessage: function(config, type, appointment, oldvalue) {

    // Check if push messages are enabled.
    if (typeof config == "undefined" || !config || config.enabled !== true) {
      return false;
    }

    // Check config.
    if (config.token.length !== 30 || config.user.length !== 30) {
      module.exports.log("notice", "sendPushMessage is not configured properly.");
      return false;
    }

    // Determine message type.
    var appointmentDate = new Date(appointment.begin).toDateString();
    if (type == "homework") {
      var title = "Homework changed";
      var message = "Homework for "+appointment.formatted.title+" on "+appointmentDate+" ";
          message += "was changed.\nBefore:\n"+oldvalue+"\nAfter:\n"+appointment.homework;
    } else if (type == "location") {
      var title = "Location changed";
      var message = "Location for "+appointment.formatted.title+" on "+appointmentDate+" ";
          message += "was changed.\nOld location: "+oldvalue+"\nNew location: "+appointment.location;
    } else if (type == "cancelled") {
      var title = "Appointment cancelled";
      var message = "Appointment "+appointment.formatted.title+" on "+appointmentDate+" ";
          message += "has been cancelled.";
    } else if (type == "status") {
      var title = "Appointment no longer cancelled";
      var message = "Appointment "+appointment.formatted.title+" on "+appointmentDate+" ";
          message += "was cancelled, but is now back on the calendar.";
    } else {
      module.exports.log("notice", "Unknown type parameter for function sendPushMessage");
      return false;
    }
    message += "\nDocent(e): "+appointment.teacher+"\nId: "+appointment.id;

    // Prepare POST data.
    var form = {
      token: config.token,
      user: config.user,
      title: title,
      message: message
    };

    // Check device(s) to send message to.
    if (config.device !== "") {
      form.device = config.device;
    }

    // Execute request.
    request({
      url: "https://api.pushover.net/1/messages.json",
      method: "POST",
      form: form
    }, function(err, response, body) {
      if (err) module.exports.log("error", "Failed to send push message.", err);
      var response = JSON.parse(body);
      if (response.errors) {
        module.exports.log("error", "Push message was not sent: ", response.errors);
      } else {
        module.exports.log("info", "Push message was sent with id "+response.request);
      }
    });
    return;
  },
  crashReport: function(loghistory) {
    loghistory += "Magister Calendar has crashed!\nPlease open a new issue at https://git.io/magister with this logfile.\n\n";
    fs.writeFile("crash_" + new Date().getTime() + ".log", loghistory, function(err) {
      if (err) {
        module.exports.log("error", "Could not save crash file to disk.", err);
      }
      else {
        module.exports.log("notice", "Saved crash report to disk.");
      }
    });
  }
}
