# Magister Calendar
Automatically plan your [Magister](http://www.schoolmaster.nl/) appointments in your [Google calendar](https://google.com/calendar).

Using [Magister.js](https://github.com/simplyGits/MagisterJS) and the [Google Calendar API](https://developers.google.com/google-apps/calendar/). Written in [NodeJS](https://nodejs.org/).

# Getting started

### Requirements
- Unix environment (For example Ubuntu, CentOS or Debian)
- NodeJS server (`nodejs` and the node package manager `npm`)
- Cronjob (`crontab` or some other cron program)
- A Google account
- Basic programming knowledge and common sense

### Installing
Make sure that all requirements are present on your system.

#### 1. Enabeling the Google Calendar API
Before being able to use Magister Calendar, you'll have to [enable the Google Calendar API](https://console.developers.google.com/flows/enableapi?apiid=calendar) through the Google Developer Console.

![Enable API](http://img.prntscr.com/img?url=http://i.imgur.com/VHo30ws.png)


When clicking Agree and Continue, Google will create your new project called My Project. When that's done, it'll prompt you to `Go to [your] Credentials`. Click `Add Credentials` and then select `OAuth 2.0 Client ID` from the dropdown menu.

![Add Credentials](http://img.prntscr.com/img?url=http://i.imgur.com/N4YlPOr.png)


The website will say that you first need to add a Product name before you can continue.
Go ahead and configure your Consent screen. You have to set `Magister Calendar` as the product name, 
all the other options are mandatory. When that's done, hit the save button and wait for the site to get back to the Create Client ID screen. Select the `Web application` option and fill in `Magister Calendar` as the name (This has to be the exact same as the product name of the consent screen). The last thing you'll have to fill in is the Authorized redirect URI.

WIP WIP WIP

![Create Client ID](http://img.prntscr.com/img?url=http://i.imgur.com/FUXOdfg.png)


# Using Magister Calendar

# Contributing

# References & sources

https://developers.google.com/google-apps/calendar/quickstart/nodejs
