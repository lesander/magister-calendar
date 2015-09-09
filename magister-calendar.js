/**
 * Magister Calendar v1.0.0
 * https://git.io/magister
 *
 * Copyright 2015 Sander Laarhoven
 * Licensed under MIT (http://git.io/magister-calendar-license)
 */


/* ======================
 * Load our requirements.
 * ====================== */

/* Require all the modules! */
var fs = require("fs");
var Magister = require("magister.js");
var request = require("request");
var util = require("util");
var tools = reqiure("./assets/tools.js");

/* Set our settings. */
var VERSION = "1.0.0";
var DEBUG = true;
var CONFIG_PATH = "config.json";
var CLIENT_PATH = "client_secret.json";
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "calendar-api.json";
var CACHE_PATH = "cache/";

/* Say hello to our creator. */
console.log("Magister Calendar v" + VERSION + " started.");


/* =========================
 * Load configuration files.
 * ========================= */

/* Load the config.json file. */
var file = fs.readFileSync(CONFIG_PATH, "utf8");
if (!tools.validjson(file)) {
  tools.log("error", "Config contains bogus JSON.");
  process.exit(1);
}
var CONFIG = JSON.parse(file);

/* Load the client_secret.json file. */
var file = fs.readFileSync(CLIENT_PATH, "utf8");
if (!tools.validjson(file)) {
  tools.log("error", "Client secret contains bogus JSON.");
  process.exit(1);
}
var CLIENT_SECRET = JSON.parse(file);

/* Load our access tokens. */
var file = fs.readFileSync(TOKEN_PATH, "utf8");
if (!tools.validjson(file)) {
  tools.log("error", "Token file contains bogus JSON.");
  process.exit(1);
}
var TOKENS = JSON.parse(file);

/* Set our Google configuration. */
var GOOGLE_CONFIG = {
  "client_id": CLIENT_SECRET.web.client_id,
  "client_secret": CLIENT_SECRET.web.client_secret,
  "calendar_id": CONFIG.calendar,
  "access_token": TOKENS.access_token,
  "refresh_token": TOKENS.refresh_token,
  "token_expiry": TOKENS.expiry_date
}


/* ====================
 * Check configuration.
 * ==================== */

/* Check magister values. */
if (CONFIG.magister_url == "" || CONFIG.magister_username == "" || CONFIG.magister_password == "") {
  tools.log("error", "Magister configuration is not filled in.");
  process.exit();
}


/* ======================================
 * Determine appointment period to fetch.
 * ====================================== */

/* Extend the Date prototype. */
Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

/* Determine the period to fetch the appointments for. */
var PERIOD = {};
var today = {};
var today.date = new Date();
var today.day = new Date().getDay();
var today.time = new Date().getHours();
var PERIOD.start = today.date;
var PERIOD.end = today.date;

/* Start our period algorithm. */
if (typeof(CONFIG.period) == "number") {
  // Fetch appointments for the next given days.
  tools.log("info", "Fetching appointments for the coming " + CONFIG.period + " days.");
  PERIOD.start.setDate(today.date.getDate());
  PERIOD.end.setDate(today.date.getDate() + CONFIG.period);
}
else {
  tools.log("info", "Using default period to fetch appointments for.");
  if (today.day == 6) {
    // Today is saturday, fetch next week.
    PERIOD.start.setDate(today.date.getDate() + 2);
    PERIOD.end.setDate(PERIOD.start.getDate() + 5);
  }
  else if (today.day == 0) {
    // Today is sunday, fetch next week.
    PERIOD.start.setDate(today.date.getDate() + 1);
    PERIOD.end.setDate(PERIOD.start.getDate() + 5);
  }
  else if (today.day == 5 && today.time >= CONFIG.day_is_over_time) {
    // Fetch next week, the weekend has just started!
    PERIOD.start.setDate(today.date.getDate() + 3);
    PERIOD.end.setDate(PERIOD.start.getDate() + 5);
  }
  else if (today.time >= CONFIG.day_is_over_time) {
    // Fetch from tomorrow, this day is over.
    PERIOD.start.setDate(today.date.getDate() + 1);
    PERIOD.end.setDate(PERIOD.start.getDate() + ( 5 - PERIOD.start.getDay() ) );
  }
  else {
    // Fetch including tomorrow, this day is not over yet.
    PERIOD.start.setDate(today.date.getDate() + 0);
    PERIOD.end.setDate(PERIOD.start.getDate() + ( 5 - PERIOD.start.getDay() ) );
  }
}

/* Magister does not look at the time we provide with our stamps,
   so there's no need to set the hours of the dates. */
tools.log("info", "Determined period is from " + PERIOD.start + " to " + PERIOD.end + ".");


/* =====================
 * Prepare Google OAuth.
 * ===================== */

/* Check if the Google OAuth2 token is still valid for atleast 5 minutes. */
var inFiveMinutes = new Date().getTime() + 300000;
if (GOOGLE_CONFIG.token_expiry < inFiveMinutes) {
  tools.log("notice", "Google OAuth2 token has expired. Requesting a new one.");
  requestNewToken(GOOGLE_CONFIG, magisterLogin);
}
else {
  tools.log("info", "Google OAuth2 token is valid.");
  magisterLogin();
}

/* Request a new OAuth2 token. */
function requestNewToken(config, callback) {
  // Construct the POST request body.
  var form: {
    client_id: GOOGLE_CONFIG.client_id,
    client_secret: GOOGLE_CONFIG.client_secret,
    refresh_token: GOOGLE_CONFIG.refresh_token,
    grant_type: "refresh_token"
  }
  // Perform the request.
  request.post("https://accounts.google.com/o/oauth2/token", {form: form}, function(err, response, body) {
    if (err) {
      return tools.log("error", "Problem requesting new OAuth2 token.", err);
    }
    result = JSON.parse(body);
    // Update the Google Config.
    GOOGLE_CONFIG.access_token = result.access_token;
    GOOGLE_CONFIG.token_type = result.token_type;
    GOOGLE_CONFIG.expires_in = result.expires_in;
    GOOGLE_CONFIG.token_expiry = new Date().getTime() + result.expires_in * 1000;
    // Update the credentials file.
    var json = {
      "access_token": result.access_token,
      "token_type": result.token_type,
      "refresh_token": GOOGLE_CONFIG.refresh_token,
      "expiry_date": GOOGLE_CONFIG.token_expiry,
      "updated_by_magcal": true
    };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(json));
    tools.log("info", "Updated OAuth2 token.");
    callback();
  });
}


/* =================================
 * Fetch appointments from Magister.
 * ================================= */

/* Login to Magister. */
function magisterLogin() {
  new Magister.Magister({
    school: {url CONFIG.magister_url},
    username: CONFIG.magister_username,
    password: CONFIG.magister_password
  }).ready(fetchAppointments);
}

/* Fetch appointments. */
function fetchAppointments(err, magisterlogin) {
  if (err) {
    return tools.log("error", "Could not login to magister.", err);
  }
  magisterlogin.appointments(PERIOD.start, PERIOD.end, false, function(err, appointments) {
    if (err) {
      return tools.log("error", "Problem fetching appointments. ", err);
    }
    // We got the appointments, now let's get the current course info.
    fetchCurrentCourse(magisterlogin, appointments, parseAppointments);
  });
}

/* Fetch current course information. */
function fetchCurrentCourse(magisterlogin, appointments, callback) {
  magisterlogin.currentCourse(function(err, currentcourse) {
    if (err) {
      return tools.log("error", "Problem fetching current course. ", err);
    }
    // Callback to parseAppointments.
    callback(appointments, currentcourse);
  });
}

/* Check if appointment is blacklisted. */
function blacklisted(appointment, i) {
  for (b = 0; b < CONFIG.blacklist.length; b++) {
    if (appointment._description == CONFIG.blacklist[b]) {
      tools.log("notice", appointment._id + " Skipping appointment #" + i + " because it's description is on the blacklist.");
      continue;
    }
  }
}


/* ==============================================
 * Parse the appointments & prepare agenda items.
 * ============================================== */

/* Parse appointments. */
function parseAppointments(appointments, currentcourse) {

  // Save appointment json for debugging purposes.
  if (CONFIG.debug) {
    fs.writeFile(CACHE_PATH + "magister-debug.dump", util.inspect(appointments), function(err) {
      if (err) {
        return tools.log("error", "Problem saving magister debug dump to file.", err);
      }
      return tools.log("info", "Saved magister debug dump to file.");
    });
  }

  /* The following block of code is written for a specific school using Magister,
     because their appointments always have wrong end times. */
  if (CONFIG.magister_url.indexOf("dspierson") > -1) {
    // Identify the user as upper or lower class.
    if (currentcourse._group.description >= 4) {
      // Bovenbouw (4, 5, 6).
      var group = "bovenbouw";
      tools.log("info", "Identified logged in user as member of upper classes.");
      var firstBreakBeginsNow = 3;
      var secondBreakBeginsNow = 5;
      var firstBreakBeginTuesday = ["10", "45"];
      var secondBreakBeginTuesday = ["12", "40"];
      var firstBreakBegin = ["11", "00"];
      var secondBreakBegin = ["13", "05"];
    }
    else {
      // Onderbouw (1, 2, 3).
      var group = "onderbouw";
      tools.log("info", "Identified logged in user as member of lower classes.");
      var firstBreakBeginsNow = 2;
      var secondBreakBeginsNow = 4;
      var firstBreakBeginTuesday = ["10", "00"];
      var secondBreakBeginTuesday = ["11", "55"];
      var firstBreakBegin = ["10", "10"];
      var secondBreakBegin = ["12", "15"];
    }
  }
  /* End of special code block. */

  // Loop through every appointment!
  for (i = 0; i < appointments.length; i++) {
    // Check our blacklist.
    if (blacklisted(appointments[i], i)) {
      continue;
    }

    // Build the appointment object.
    var appointment = {
      "version": "1.0.0",
      "id": appointments[i]._id,
      "location": appointments[i]._location,
      "description": appointments[i]._description,
      "begin": appointments[i]._begin,
      "end": appointments[i]._end,
      "schoolhour": appointments[i]._beginBySchoolHour,
      "class": appointments[i]._classes[0],
      "teacher": appointments[i]._teachers[0]._fullName,
      "status": appointments[i]._status,
      "type": appointments[i]._type,
      "homework": "",
      "formatted": {}
    };

    // Add content (homework) to the appointment if there is any.
    if (appointments[i]._content) {
      appointment.homework = appointments[i]._content;
    }

    // Strip the homework string of HTML stuff.
    appointment.homework = appointment.homework.replace("<br/>", "\n");
    appointment.homework = appointment.homework.replace("&nbsp;", "");
    appointment.homework = appointment.homework.replace(/(<([^>]+)>)/ig,"");

    /* The following block of code is written for a specific school using Magister,
       because their appointments always have wrong end times. */
    if (CONFIG.magister_url.indexOf("dspierson") > -1) {
      // Check if we need to change end times for this appointment.
      if (new Date(appointment.begin).getDay() == 2 && appointment.schoolhour == firstBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours( firstBreakBeginTuesday[0] - new Date(appointment.end).getTimezoneOffset() );
        epoch = new Date(epoch).setMinutes(firstBreakBeginTuesday[1]);
        appointment.end = new Date(epoch).toISOString();
      }
      else if (new Date(appointment.begin).getDay() == 2 && appointment.schoolhour == secondBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours( secondBreakBeginTuesday[0] - new Date(appointment.end).getTimezoneOffset() );
        epoch = new Date(epoch).setMinutes(secondBreakBeginTuesday[1]);
        appointment.end = new Date(epoch).toISOString();
      }
      else if (appointment.schoolhour == firstBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours( firstBreakBegin[0] - new Date(appointment.end).getTimezoneOffset() );
        epoch = new Date(epoch).setMinutes(firstBreakBegin[1]);
        appointment.end = new Date(epoch).toISOString();
      }
      else if (appointment.schoolhour == secondBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours( secondBreakBegin[0] - new Date(appointment.end).getTimezoneOffset() );
        epoch = new Date(epoch).setMinutes(secondBreakBegin[1]);
        appointment.end = new Date(epoch).toISOString();
      }
    }
    /* End of special code block. */

    // Format the agenda item.
    appointment.formatted = {
      "title": "["+appointment.schoolhour+"] "+appointment.description,
      "location": "Lokaal "+appointment.location,
      "description": "Docent(e): "+appointment.teacher+"\nHuiswerk: "+appointment.homework+"\nId: "+appointment.id
    };

    // Check if the appointment was already cached.
    var appointment.path = CACHE_PATH + "appointment_" + appointment.id + ".json";
    if (fs.existsSync(appointment.path)) {
      tools.log("notice", appointment.id + " Appointment is in cache.");

      // Obtain cached json.
      var cache = fs.readFileSync(appointment.path, "utf8");
      var cache = JSON.parse(cache);

      // Check if the homework is still the same.
      if (cache.homework != appointment.homework) {
        // We'd certainly want to catch the teacher doing this..
        tools.log("notice", appointment.id + " Homework has changed.");
        sendPushMessage(appointment);
      }

      // Check if the cached appointment is the same as the current one.
      if (cache != JSON.stringify(appointment)) {
        // The cached appointment differs from the live one.
        tools.log("notice", appointment.id + " Appointment has changed.");
        calendarItem("update", appointment, GOOGLE_CONFIG);
      }
    }
    else {
      // This is a new appointment, create new item.
      tools.log("notice", appointment.id + " Appointment is new.");
      calendarItem("create", appointment, GOOGLE_CONFIG);
    }

    // Cache the appointment to file.
    fs.writeFileSync(appointment.path, JSON.stringify(appointment));

    // Check if we've had all appointments.
    if (i == appointments.length) {
      tools.log("info", "All appointments have been parsed.");
    }
  }
}


/* =====================================
 * Send agenda items to Google Calendar.
 * ===================================== */

/* Send a calendar item to Google. */
function calendarItem(action, appointment, googleconfig) {
  // Construct the form object as per v3 of the Calendar API.
  var form = {
    "client_id": googleconfig.client_id,
    "client_secret": googleconfig.client_secret,
    "id": appointment.id,
    "summary": appointment.formatted.title,
    "description": appointment.formatted.description,
    "location": appointment.formatted.location,
    "start": {
      "dateTime": appointment.begin
    },
    "end": {
      "dateTime": appointment.end
    },
    "reminders" {
      "useDefault": false,
      "overrides": CONFIG.reminders
    }
  };

  // Cancel the appointment & send a message if the status is cancelled (5).
  if (appointment.status == 5) {
    tools.log("notice", appointment.id + " Appointment has been cancelled, updating status.");
    form.status = "cancelled";
    form.colorId = 4; // Red color scheme.
    sendPushMessage(appointment);
  }

  // Determine the request method.
  if (action == "create") {
    var method = "POST";
  }
  else if (action == "update") {
    var method = "PUT";
  }

  // Make the request to Google.
  request({
    url: "https://www.googleapis.com/calendar/v3/calendars/primary/events/" + appointment.id,
    method: method,
    json: form,
    headers: {
      "Authorization": "Bearer " + googleconfig.access_token,
      "Content-Type": "application/json"
    }
  }, function(err, response, body) {
    // Check for request error.
    if (err) {
      return tools.log("error", appointment.id + " Error " + action.slice(0, -1) + "ing appointment.", err);
    }

    // Check for response error.
    if (body.error) {
      return tools.log("error", appointment.id + " Error " + action.slice(0, -1) + "ing appointment.", error);
    }

    // Hooray, we've created/updated the appointment.
    tools.log("info", appointment.id + " " + action.charAt(0).toUpperCase() + action.slice(1) + "d appointment.");
  });
}
