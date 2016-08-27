/**
 * Magister Calendar v1.7.0
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
var tools = require("./assets/tools.js");

/* Set our settings. */
var VERSION = "1.7.0";
var DEBUG = false;
var CONFIG_PATH = "config.json";
var CLIENT_PATH = "client_secret.json";
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "calendar-api.json";
var CACHE_PATH = "cache/";

/* Say hello to our creator. */
tools.log("info", "Magister Calendar v" + VERSION + " started.\nSystem Time: " + new Date().toLocaleTimeString());

/* Make sure we have our cache folder. */
fs.mkdir(CACHE_PATH, function(err) {
  if (err) {
    if (err.code != "EEXIST") {
      tools.log("error", "Could not create folder 'cache/'.", err);
      process.exit(1);
    }
  }
  else {
    tools.log("info", "Created cache folder.");
  }
});


/* =========================
 * Load configuration files.
 * ========================= */

/* Load the config.json file. */
var CONFIG = tools.loadJSONfile(CONFIG_PATH);

/* Load the client_secret.json file. */
var CLIENT_SECRET = tools.loadJSONfile(CLIENT_PATH);

/* Load our access tokens. */
var TOKENS = tools.loadJSONfile(TOKEN_PATH);

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
if (CONFIG.magister_url == "" || CONFIG.magister_username == "" || CONFIG.magister_password == "" ||
    typeof(CONFIG.magister_url) != "string" || typeof(CONFIG.magister_username) != "string" ||
    typeof(CONFIG.magister_password) != "string") {
  tools.log("error", "CONFIG PARSE ERROR: Magister configuration is not filled in.");
  process.exit(1);
}

/* Check if calendar has a value. */
if (typeof(CONFIG.calendar) != "string" || CONFIG.calendar == "") {
  tools.log("error", "CONFIG PARSE ERROR: 'calendar' has invalid value.");
  process.exit(1);
}

/* Check if period has a valid value. */
if (typeof(CONFIG.period) != "string" && typeof(CONFIG.period) != "number") {
  tools.log("error", "CONFIG PARSE ERROR: 'period' has invalid value.");
  process.exit(1);
}

/* Check if remove_cancelled_classes has a valid value. */
if (typeof(CONFIG.remove_cancelled_classes) != "boolean") {
  tools.log("error", "CONFIG PARSE ERROR: 'remove_cancelled_classes' has invalid value.");
  process.exit(1);
}

/* Check if blacklist has a valid value. */
if (typeof(CONFIG.blacklist) != "object") {
  tools.log("error", "CONFIG PARSE ERROR: 'blacklist' has invalid value.");
  process.exit(1);
}

/* Check if reminders has a valid value. */
if (typeof(CONFIG.reminders) != "object" || CONFIG.reminders.length > 5) {
  tools.log("error", "CONFIG PARSE ERROR: 'reminders' has invalid value or length.");
  process.exit(1);
}

/* ======================================
 * Determine appointment period to fetch.
 * ====================================== */

/* Determine the period to fetch the appointments for. */
var PERIOD = {};
var today = {};
    today.date = new Date();
    today.day = new Date().getDay();
    today.time = new Date().getHours();
    PERIOD.start = today.date;
    PERIOD.end = today.date;

/* Start our period algorithm. */
if (typeof(CONFIG.period) == "number") {
  // Fetch appointments for the next given days.
  tools.log("info", "Fetching appointments for the coming " + CONFIG.period + " days.");
  PERIOD.start = PERIOD.start.setDate(today.date.getDate());
  PERIOD.end = PERIOD.end.setDate(today.date.getDate() + CONFIG.period);
}
else {
  tools.log("info", "Using default period to fetch appointments for.");
  if (today.day == 6) {
    // Today is saturday, fetch next week.
    PERIOD.start = PERIOD.start.setDate(today.date.getDate() + 2);
    PERIOD.end = PERIOD.end.setDate(new Date(PERIOD.start).getDate() + 5);
  }
  else if (today.day == 0) {
    // Today is sunday, fetch next week.
    PERIOD.start = PERIOD.start.setDate(today.date.getDate() + 1);
    PERIOD.end = PERIOD.end.setDate(new Date(PERIOD.start).getDate() + 5);
  }
  else if (today.day == 5 && today.time >= CONFIG.day_is_over_time) {
    // Fetch next week, the weekend has just started!
    PERIOD.start = PERIOD.start.setDate(today.date.getDate() + 3);
    PERIOD.end = PERIOD.end.setDate(new Date(PERIOD.start).getDate() + 5);
  }
  else if (today.time >= CONFIG.day_is_over_time) {
    // Today is either monday, tuesday, wednesday or thursday past day_is_over_time.
    // Fetch from tomorrow, this day is over.
    PERIOD.start = PERIOD.start.setDate(today.date.getDate() + 1);
    PERIOD.end = PERIOD.end.setDate(new Date(PERIOD.start).getDate() + ( 5 - new Date(PERIOD.start).getDay() ) );
  }
  else if (today.time <= CONFIG.day_is_over_time && today.day <= 5 && today.day >= 1) {
    // Today is either monday, tuesday, wednesday, thursday or friday before day_is_over_time.
    // Fetch including tomorrow, this day is not over yet.
    PERIOD.start = PERIOD.start.setDate(today.date.getDate() + 0);
    PERIOD.end = PERIOD.end.setDate(new Date(PERIOD.start).getDate() + ( 5 - new Date(PERIOD.start).getDay() ) );
  }
  else {
    // It's not saturday, sunday, friday past time, past time (at any day), before time (at any day).
    // What kind of sorcery is this?
    tools.log("critical", "Could not determine period, this should never happen. Please open an issue at GitHub, with all log files.");
    process.exit(1);
  }
}

/* Magister does not look at the time we provide with our stamps,
   so there's no need to set the hours of the dates. */
tools.log("info", "Determined period is:\nFrom " + new Date(PERIOD.start) + "\nTo " + new Date(PERIOD.end) + ".");


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
  var form = {
    client_id: GOOGLE_CONFIG.client_id,
    client_secret: GOOGLE_CONFIG.client_secret,
    refresh_token: GOOGLE_CONFIG.refresh_token,
    grant_type: "refresh_token"
  }
  // Perform the request.
  request.post("https://accounts.google.com/o/oauth2/token", {form: form}, function(err, response, body) {
    if (err) {
      tools.log("critical", "Problem requesting new OAuth2 token.", err);
      process.exit(1);
    }
    result = JSON.parse(body);
    // Check for errors.
    if (result.error) {
      tools.log("critical", "Problem requesting new OAuth2 token: "+result.error.errors[0].message, result.error);
      process.exit(1);
    }
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
    school: {url: CONFIG.magister_url},
    username: CONFIG.magister_username,
    password: CONFIG.magister_password
  }).ready(function(err) {
    fetchAppointments(err, this);
  });
}

/* Fetch appointments. */
function fetchAppointments(err, magisterlogin) {
  if (err) {
    tools.log("error", "Could not login to magister.", err);
    process.exit(1);
  }
  magisterlogin.appointments(new Date(PERIOD.start), new Date(PERIOD.end), false, function(err, appointments) {
    if (err) {
      tools.log("critical", "Problem fetching appointments. ", err);
      process.exit(1);
    }
    // We got the appointments, now let's get the current course info.
    fetchCurrentCourse(magisterlogin, appointments, parseAppointments);
  });
}

/* Fetch current course information. */
function fetchCurrentCourse(magisterlogin, appointments, callback) {
  magisterlogin.currentCourse(function(err, currentcourse) {
    if (err) {
      tools.log("critical", "Problem fetching current course. ", err);
      process.exit(1);
    }
    // Callback to parseAppointments.
    callback(appointments, currentcourse);
  });
}

/* Check if appointment is blacklisted. */
function blacklisted(appointment, i) {
  for (b = 0; b < CONFIG.blacklist.length; b++) {
    if (appointment.description() == CONFIG.blacklist[b]) {
      tools.log("notice", appointment.id() + " Skipping blacklisted appointment.");
      return true;
    }
  }
  return false;
}


/* ==============================================
 * Parse the appointments & prepare agenda items.
 * ============================================== */

/* Parse appointments. */
function parseAppointments(appointments, currentcourse) {

  // Save appointment json for debugging purposes.
  if (DEBUG) {
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
    if (currentcourse.group().description >= 4) {
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
      "version": "2.0.0",
      "id": appointments[i].id(),
      "location": appointments[i].location(),
      "description": appointments[i].description(),
      "begin": appointments[i].begin(),
      "end": appointments[i].end(),
      "schoolhour": appointments[i].beginBySchoolHour(),
      "class": appointments[i].classes()[0],
      "status": appointments[i].status(),
      "type": appointments[i].type(),
      "homework": appointments[i].content(),
      "prefix": "[" + appointments[i].beginBySchoolHour() + "]",
      "formatted": {}
    };

    // Add teacher's name if there is any.
    if (appointments[i].teachers().length > 0) {
     appointment.teacher = appointments[i].teachers()[0].fullName();
    }

    // Check the ID.
    if (appointments[i].id().length < 7 || appointments[i].id() == -1) {
      var newid = "i" + new Date(appointment.begin).getTime();
      tools.log("notice", appointment.id + " Appointment has invalid ID, changing to '" + newid + "'.");
      appointment.id = newid;
    }

    /* The following block of code is written for a specific school using Magister,
       because their appointments always have wrong end times. */
    if (CONFIG.magister_url.indexOf("dspierson") > -1) {
      // Check if we need to change end times for this appointment.
      if (new Date(appointment.begin).getDay() == 2 && appointment.schoolhour == firstBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours(firstBreakBeginTuesday[0]);
        epoch = new Date(epoch).setMinutes(firstBreakBeginTuesday[1]);
        appointment.end = new Date(epoch).toISOString();
      }
      else if (new Date(appointment.begin).getDay() == 2 && appointment.schoolhour == secondBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours(secondBreakBeginTuesday[0]);
        epoch = new Date(epoch).setMinutes(secondBreakBeginTuesday[1]);
        appointment.end = new Date(epoch).toISOString();
      }
      else if (appointment.schoolhour == firstBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours(firstBreakBegin[0]);
        epoch = new Date(epoch).setMinutes(firstBreakBegin[1]);
        appointment.end = new Date(epoch).toISOString();
      }
      else if (appointment.schoolhour == secondBreakBeginsNow) {
        epoch = new Date(appointment.end).setHours(secondBreakBegin[0]);
        epoch = new Date(epoch).setMinutes(secondBreakBegin[1]);
        appointment.end = new Date(epoch).toISOString();
      }
    }
    /* End of special code block. */

    // Some appointments don't have a schoolhour assigned. This removes the prefix instead of schowing '[null]'
    if(appointment.schoolhour == null){
      appointment.prefix = "";
    }

    // Format the agenda item.
    appointment.formatted = {
      "title": appointment.prefix+" "+appointment.description,
      "location": "Lokaal "+appointment.location,
      "description": "Docent(e): "+appointment.teacher+"\nHuiswerk: "+appointment.homework+"\nId: "+appointment.id
    };

    // Check if the appointment was already cached.
    appointment.path = CACHE_PATH + "appointment_" + appointment.id + ".json";
    if (fs.existsSync(appointment.path)) {
      tools.log("notice", appointment.id + " Appointment is in cache.");

      // Obtain cached json.
      var cache = fs.readFileSync(appointment.path, "utf8");
      if (!tools.validjson(cache)) {
        tools.log("warning", appointment.id + " Appointment cache has invalid JSON, can't compare. Will save new json to file. Running again.");
        fs.writeFileSync(appointment.path, JSON.stringify(appointment));
        i--;
        continue;
      }
      var cache = JSON.parse(cache);

      // Check if the homework is still the same.
      if (cache.homework !== appointment.homework) {
        // We'd certainly want to catch the teacher doing this..
        tools.log("notice", appointment.id + " Homework has changed.");
        tools.sendPushMessage(CONFIG.pushover, "homework", appointment, cache.homework);
      }

      // Check if the location is still the same.
      if (cache.location !== appointment.location) {
        tools.log("notice", appointment.id + " Location has changed.");
        tools.sendPushMessage(CONFIG.pushover, "location", appointment, cache.location);
      }

      // Oh oh. Bad news?
      if (cache.status == 5 && appointment.status != 5) {
        tools.log("notice", appointment.id + " Status has changed.");
        tools.sendPushMessage(CONFIG.pushover, "status", appointment, cache.status);
      }

      // Check if the cached appointment is the same as the current one.
      if (JSON.stringify(cache) !== JSON.stringify(appointment)) {
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

    // Check if we've had all appointments.
    if (i == appointments.length - 1) {
      tools.log("info", "All appointments have been parsed.");
    }
  }
}


/* =====================================
 * Send agenda items to Google Calendar.
 * ===================================== */

/* Send a calendar item to Google. */
function calendarItem(action, appointment, googleconfig, retry) {
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
    "reminders": {
      "useDefault": false,
      "overrides": CONFIG.reminders
    }
  };

  // Check if we actually have at least one override.
  if (!form.reminders.overrides[0]) {
    form.reminders.useDefault = true;
    form.reminders.overrides = null;
  }

  // Is magister trying to be funny?
  if (new Date(form.start.dateTime).getTime() > new Date(form.end.dateTime).getTime()) {
    // The start date is after the end date...
    tools.log("notice", appointment.id + " Appointment has invalid times, changing to short appointment.");
    // Let's take the start date and add five minute to set as the end time.
    var minutes = new Date(form.start.dateTime).getMinutes();
    var endtime = new Date(form.start.dateTime).setMinutes(minutes + 5);
    form.end.dateTime = new Date(endtime).toISOString();
  }

  // Cancel the appointment & send a message if the status is cancelled (5).
  if (appointment.status == 5) {
    tools.log("notice", appointment.id + " Appointment has been cancelled, updating status.");
    // Cancel appointment if config allows it.
    if (CONFIG.remove_cancelled_classes) {
      form.status = "cancelled";
    }
    else {
      // Else just add text to summary.
      form.summary = "[UITVAL] " + form.summary;
    }
    form.colorId = 4; // Red color scheme.
    tools.sendPushMessage(CONFIG.pushover, "cancelled", appointment, false);
  }

  // Determine the request method.
  var url = "https://www.googleapis.com/calendar/v3/calendars/" + CONFIG.calendar + "/events";
  if (action == "create") {
    var method = "POST";
  }
  else if (action == "update") {
    var method = "PUT";
    var url = url + "/" + appointment.id;
  }

  // Make the request to Google.
  request({
    url: url,
    method: method,
    json: form,
    headers: {
      "Authorization": "Bearer " + googleconfig.access_token,
      "Content-Type": "application/json"
    }
  }, function(err, response, body) {
    // Debug response to file.
    if (DEBUG) fs.writeFile(CACHE_PATH + "appointment_" + appointment.id + "_response_debug.json", JSON.stringify(err) + "\n" + JSON.stringify(response) + "\n" + JSON.stringify(body));

    // Check for request error.
    if (err) {
      return tools.log("error", appointment.id + " Error " + action.slice(0, -1) + "ing appointment.", err);
      fs.writeFile(CACHE_PATH + "appointment_" + appointment.id + "_request_error.json", JSON.stringify(err) + "\n" + JSON.stringify(response) + "\n" + JSON.stringify(body));
    }

    // Check for response error.
    if (body.error) {
      tools.log("error", appointment.id + " Error " + action.slice(0, -1) + "ing appointment.", body.error);

      // Check for duplicate.
      if (body.error.code == 409) {
        tools.log("notice", appointment.id + " Appointment is a duplicate, updating instead.");
        calendarItem("update", appointment, googleconfig);
      }

      // Check if we should use exponential backoff.
      if (
          (body.error.code == 403 && body.error.errors[0].reason == "rateLimitExceeded") ||
          (body.error.code == 503 && body.error.errors[0].reason == "backendError")
         ) {

        // Make sure retry is set.
        if (typeof retry == "undefined") {
          var retry = 0;
        }

        // Only retry 10 times.
        if (retry/2 >= 10) {
          tools.log("notice", appointment.id + " Failed to add appointment after trying 10 times.");
          return false;
        }

        // Retry updating/creating appointment.
        tools.log("notice", appointment.id + " Failed to add appointment after trying "+retry/2+" times, retrying in 2 seconds.");
        setTimeout(function() {
          calendarItem(action, appointment, googleconfig, retry+2);
        }, retry*1000);
      }

      return;
    }

    // Hooray, we've created/updated the appointment.
    tools.log("info", appointment.id + " " + action.charAt(0).toUpperCase() + action.slice(1) + "d appointment.");

    // Cache the appointment to file.
    fs.writeFileSync(appointment.path, JSON.stringify(appointment));
  });
}
