var tools = require("../assets/tools.js");

module.exports = {
  /* This function should return the course title
   * from the (sometimes) messy title Magister gives.
   * Example:
   * biol - pls - v6biol1
   * 'biol' is the abbrevation for Biology which we
   * need to look up our pretty course title.
   * 
   * You should change this function depending on how
   * your school's Magister gives the title.
   */
   getTitle: function(title) {
    return title.split("-")[0].trim();
  },

  /* Unfortunately a lot of school include the breaks
   * in the appointments which can be confusing, as well
   * as other wrong beginning/end times.
   *
   * You can use this function to fix any mistakes there
   * are in beginning/end times.
   * 
   * See zwin.js or dspierson.js for examples
   */
   fixTimes: function(course, appointment) {
    var description = course.type.description;
    var year = description.charAt(description.length -1);

    // Identify the user as upper or lower class.
    if (year == "4" || year == "5" || year == "6") {
      // Bovenbouw (4, 5, 6).
      var firstBreakBeginsNow = 3;
      var secondBreakBeginsNow = 5;
      var secondBreakBeginsNowTuesday = 6;

      var firstBreakBeginTuesday = ["10", "15"];
      var secondBreakBeginTuesday = ["12", "30"];
      var firstBreakBegin = ["10", "45"];
      var secondBreakBegin = ["12", "40"];
    } else {
      // Onderbouw (1, 2, 3).
      var firstBreakBeginsNow = 2;
      var secondBreakBeginsNow = 4;
      var secondBreakBeginsNowTuesday = 5;

      var firstBreakBeginTuesday = ["9", "35"];
      var secondBreakBeginTuesday = ["11", "50"];
      var firstBreakBegin = ["9", "55"];
      var secondBreakBegin = ["11", "50"];
    }

    // Check if we need to change end times for this appointment.
    if (new Date(appointment.begin).getDay() == 2 && appointment.schoolhour == firstBreakBeginsNow) {
      epoch = new Date(appointment.end).setHours(firstBreakBeginTuesday[0]);
      epoch = new Date(epoch).setMinutes(firstBreakBeginTuesday[1]);
      appointment.end = new Date(epoch).toISOString();
    }
    else if (new Date(appointment.begin).getDay() == 2 && appointment.schoolhour == secondBreakBeginsNowTuesday) {
      epoch = new Date(appointment.end).setHours(secondBreakBeginTuesday[0]);
      epoch = new Date(epoch).setMinutes(secondBreakBeginTuesday[1]);
      appointment.end = new Date(epoch).toISOString();
    }
    else if (new Date(appointment.begin).getDay() != 2 && appointment.schoolhour == firstBreakBeginsNow) {
      epoch = new Date(appointment.end).setHours(firstBreakBegin[0]);
      epoch = new Date(epoch).setMinutes(firstBreakBegin[1]);
      appointment.end = new Date(epoch).toISOString();
    }
    else if (new Date(appointment.begin).getDay() != 2 && appointment.schoolhour == secondBreakBeginsNow) {
      epoch = new Date(appointment.end).setHours(secondBreakBegin[0]);
      epoch = new Date(epoch).setMinutes(secondBreakBegin[1]);
      appointment.end = new Date(epoch).toISOString();
    }

    return appointment;
  }
}