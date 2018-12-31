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
      return title.trim();
  }

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
    // Identify the user as upper or lower class.
    if (course.group.description >= 4) {
      // Bovenbouw (4, 5, 6).
      var firstBreakBeginsNow = 3;
      var secondBreakBeginsNow = 5;
      
      var firstBreakBeginTuesday = ["10", "45"];
      var secondBreakBeginTuesday = ["12", "40"];
      var firstBreakBegin = ["11", "00"];
      var secondBreakBegin = ["13", "05"];
    } else {
      // Onderbouw (1, 2, 3).
      var firstBreakBeginsNow = 2;
      var secondBreakBeginsNow = 4;
      
      var firstBreakBeginTuesday = ["10", "00"];
      var secondBreakBeginTuesday = ["11", "55"];
      var firstBreakBegin = ["10", "10"];
      var secondBreakBegin = ["12", "15"];
    }

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

    return appointment;
  }
}