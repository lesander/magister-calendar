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
  getTitle: function (title) {
    return title.trim()
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
  fixTimes: function (course, appointment) {
    return appointment
  }
}
