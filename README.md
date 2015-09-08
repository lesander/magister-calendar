# Magister Calendar
Automatically plan your [Magister](http://www.schoolmaster.nl/) appointments in your [Google calendar](https://google.com/calendar).

Using [Magister.js](https://github.com/simplyGits/MagisterJS) and the [Google Calendar API](https://developers.google.com/google-apps/calendar/). Written in [NodeJS](https://nodejs.org/).

# Getting started

## Requirements
- Unix environment (For example Ubuntu, CentOS or Debian)
- NodeJS server (`nodejs` and the node package manager `npm`)
- Cronjob (`crontab` or some other cron program)
- A Google account
- Basic programming knowledge and common sense

## Installing
Make sure that all requirements are present on your system.

### 1. Enabeling the Google Calendar API
Before being able to use Magister Calendar, you'll have to [enable the Google Calendar API](https://console.developers.google.com/flows/enableapi?apiid=calendar) through the Google Developer Console. Thhis little tutorial will help you get through the maze of Google's Developer Console.

![Enable API](http://img.prntscr.com/img?url=http://i.imgur.com/VHo30ws.png)


When clicking Agree and Continue, Google will create your new project called My Project. When that's done, it'll prompt you to `Go to [your] Credentials`. Click `Add Credentials` and then select `OAuth 2.0 Client ID` from the dropdown menu.

![Add Credentials](http://img.prntscr.com/img?url=http://i.imgur.com/N4YlPOr.png)


The website will say that you first need to add a Product name before you can continue.
Go ahead and configure your Consent screen. You have to set `Magister Calendar` as the product name, 
all the other options are mandatory. When that's done, hit the save button and wait for the site to get back to the Create Client ID screen. 

![Create Client ID](http://img.prntscr.com/img?url=http://i.imgur.com/FUXOdfg.png)


Select the `Web application` option and fill in `Magister Calendar` as the name (This has to be the exact same as the product name of the consent screen). The last thing you'll have to fill in is the Authorized redirect URI. You can set this to a phony URL, for example `http://localhost/authcallback`, or to `https://lesander.me/gauthhelper.html` to be able to read the auth key easily (more on that later in the readme).
When that's all done, hit the Done button.

![Create Client ID Application name](http://img.prntscr.com/img?url=http://i.imgur.com/Evq752L.png)


Great, you've just created your application at the Google Developers Console. You'll now be shown your `Client Secret` and `Client ID`. This is important stuff, you'll want to copy and paste them somewhere, we're going to need them in the coming steps.

![Client Secret and Client ID](http://img.prntscr.com/img?url=http://i.imgur.com/d0lZcVR.png)


Click OK and you will see an overview of all your OAuth Client IDs. Click on the Magister Calendar one.

![Client ID overview](http://img.prntscr.com/img?url=http://i.imgur.com/6A3orXA.png)

We will need the credentials in JSON format, so download the ID and secret by clicking `Download JSON`.

![Download JSON](http://img.prntscr.com/img?url=http://i.imgur.com/21Bf2m3.png)

### 2. Download Magister Calendar


### 3. Authorize Magister Calendar

Awesome, you're almost ready to start using Magister Calendar. The last thing we need to do before we start the cronjob, is authorize the application with Google. You can do this easily by firing up a terminal and cd'ing to the project folder and running `nodejs firstrun.js`. Make sure you've got the JSON file you downloaded earlier in the same directory and renamed it to `client_secret.json`.


# Using Magister Calendar

Coming to a readme close to you soon..

# Contributing

Coming to a readme close to you soon..

# Copyright & License

Coming to a readme close to you soon..

# References & Sources

https://developers.google.com/google-apps/calendar/
https://console.developers.google.com/
http://simplyapps.nl/MagisterJS/docs/
