/**
 * Magister Calendar v1.8.3
 * https://git.io/magister
 *
 * Copyright 2015 Sander Laarhoven
 * Licensed under MIT (http://git.io/magister-calendar-license)
 */

var fs = require('fs')
var request = require('request')

var LOG_HISTORY = ''

module.exports = {
  // Check JSON validity
  validateJSON: function (string) {
    try {
      JSON.parse(string)
    } catch (e) {
      return false
    }
    return true
  },
  // Add a 0 to digits so that
  // the time in log functions
  // looks better.
  pad: function (n) {
    return n > -1 && n < 10 ? `0${n}` : `${n}`
  },
  // Log a message to console
  // if status is set to 'critical'
  // the program will exit and
  // write a crash report to disk.
  log: function (status, text, error) {
    var prefix = '*'
    if (status === 'error' || status === 'critical') {
      prefix = '!'
    }

    var date = new Date()
    var time = module.exports.pad(date.getHours()) + ':' + module.exports.pad(date.getMinutes()) + ':' + module.exports.pad(date.getSeconds())
    var logtext = '[' + prefix + '] ' + time + ' ' + text
    if (error) {
      logtext += ' ' + JSON.stringify(error)
    }
    LOG_HISTORY += logtext + '\n'
    console.log(logtext)
    if (status === 'critical') {
      module.exports.crashReport(LOG_HISTORY)
      process.exit(1)
    }
  },
  // Load a JSON file.
  loadJSONfile: function (path) {
    // File variable
    var file

    // Try to read the file
    try {
      file = fs.readFileSync(path, 'utf8')
    } catch (e) {
      if (e.code === 'ENOENT') {
        module.exports.log('critical', `JSON file ${path} not found.`, e)
      } else {
        module.exports.log('critical', `An error occured when opening ${path}.`, e)
      }
    }

    // Try to parse the file
    try {
      return JSON.parse(file)
    } catch (e) {
      module.exports.log('critical', `JSON file ${path} could not be parsed.`, e)
    }
  },
  // Send a push notification
  // if an appointment changed.
  sendPushMessage: function (config, type, appointment, oldvalue) {
    // Check if push messages are enabled.
    if (typeof config === 'undefined' || !config || config.enabled !== true) {
      return false
    }

    // Check config.
    if (config.token.length !== 30 || config.user.length !== 30) {
      module.exports.log('notice', 'sendPushMessage is not configured properly.')
      return false
    }

    // Determine message type.
    var appointmentDate = new Date(appointment.begin).toDateString()
    var title
    var message

    if (type === 'homework') {
      title = 'Homework changed'
      message = 'Homework for ' + appointment.formatted.title + ' on ' + appointmentDate + ' '
      message += 'was changed.\nBefore:\n' + oldvalue + '\nAfter:\n' + appointment.homework
    } else if (type === 'location') {
      title = 'Location changed'
      message = 'Location for ' + appointment.formatted.title + ' on ' + appointmentDate + ' '
      message += 'was changed.\nOld location: ' + oldvalue + '\nNew location: ' + appointment.location
    } else if (type === 'cancelled') {
      title = 'Appointment cancelled'
      message = 'Appointment ' + appointment.formatted.title + ' on ' + appointmentDate + ' '
      message += 'has been cancelled.'
    } else if (type === 'status') {
      title = 'Appointment no longer cancelled'
      message = 'Appointment ' + appointment.formatted.title + ' on ' + appointmentDate + ' '
      message += 'was cancelled, but is now back on the calendar.'
    } else {
      module.exports.log('notice', 'Unknown type parameter for function sendPushMessage')
      return false
    }
    message += '\nDocent(e): ' + appointment.teacher + '\nId: ' + appointment.id

    // Prepare POST data.
    var form = {
      token: config.token,
      user: config.user,
      title: title,
      message: message
    }

    // Check device(s) to send message to.
    if (config.device !== '') {
      form.device = config.device
    }

    // Execute request.
    request({
      url: 'https://api.pushover.net/1/messages.json',
      method: 'POST',
      form: form
    }, function (err, response, body) {
      if (err) module.exports.log('error', 'Failed to send push message.', err)
      response = JSON.parse(body)
      if (response.errors) {
        module.exports.log('error', 'Push message was not sent: ', response.errors)
      } else {
        module.exports.log('info', 'Push message was sent with id ' + response.request)
      }
    })
  },
  // Create a crash report
  // containing the log
  // history.
  crashReport: function (loghistory) {
    loghistory += 'Magister Calendar has crashed!\nPlease open a new issue at https://git.io/magister with this logfile.\n\n'
    fs.writeFile('crash_' + new Date().getTime() + '.log', loghistory, function (err) {
      if (err) {
        module.exports.log('error', 'Could not save crash file to disk.', err)
      } else {
        module.exports.log('notice', 'Saved crash report to disk.')
      }
    })
  }
}
