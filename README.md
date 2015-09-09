<p align="center">
  <img src="http://img.prntscr.com/img?url=http://i.imgur.com/psGRivv.png" alt="Magister Calendar Logo">
</p>
<p align="center">
  Automatically plan your <a href="http://www.schoolmaster.nl/">Magister</a> appointments in your <a href="https://google.com/calendar">Google calendar</a>.<br/>
  Uses <a href="https://github.com/simplyGits/MagisterJS">Magister.js</a> and the <a href="https://developers.google.com/google-apps/calendar/">Google Calendar API</a>. Written in <a href="https://nodejs.org/">NodeJS</a>.
</p>

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

You can download the latest release [here](https://github.com/lesander/magister-calendar/releases), or do a `git clone`. Extract the project in a folder and put the earlier downloaded `client_secret.json` in the same directory.
Your working directory should look somewhat like this:
```
├── assets
│   ├── debug.dump
│   └── token.json
├── client_secret.json
├── config.json
├── firstrun.js
├── magister-calendar.js
└── package.json
```
Now we're going to install all the dependencies of Magister Calendar. Do so by running `npm install` inside the working directory. This can take a while, as the package manager will download all the required depencencies, including the dependencies of the dependencies, and so forth.


### 3. Authorize Magister Calendar

Awesome, you're almost ready to start using Magister Calendar. The last thing we need to do before we start the cronjob, is authorize the application with Google. You can do this easily by firing up a terminal and cd'ing to the project folder and running `nodejs firstrun.js`. Make sure you've got the JSON file you downloaded earlier in the same directory and have renamed it to `client_secret.json`.

The script will produce an authorization URL you will need to visit in your browser. Click the link and then proceed to login with your Google account. After authorizing your application, you will be redirected to the redirect URL you provided earlier, with an access token attatched to it. Copy that access token and paste it in the terminal running the firstrun.js script. When it's done obtaining the access and refresh token, you're all set with all the Google authentication stuff.

### 4. Configuring Magister Calendar
The main configuration file of Magister Calendar is called `config.json` and uses JSON (duuh). You can change the settings to your liking, I'll explain some of the options here.

Please note that before setting up a cronjob, it'd be clever to try out Magister Calendar with your configuration manually, by running `nodejs /path/to/magister-calendar.js` and checking the result for any notices, warnings and errors.

### 5. Setting up the cronjob
Open your favourite cronjob manager and add the command `nodejs /path/to/magister-calendar.js` to the cron file. You should not make the cronjob run more than once per minute, because Magister Calendar can take up to a minute to finish executing.

In this example, we'll be using `crontab`, one of the most common cronjob managers. To start editing your cron file, run `crontab -e`. Add the following line at the end of the file to execute Magister Calendar every minute: 
`*/1 * * * * nodejs /path/to/magister-calendar.js`. For more on the crontab syntax, [see this article](http://www.adminschoice.com/crontab-quick-reference) or run `man crontab` in a terminal.

# Using Magister Calendar
Once you've got the cronjob up and running (or ran `magister-calendar.js` successfully at least once), you can check your filled in calendar at [Google Calendar](https://google.com/calendar) or on your favourite calendar application synced with Google Calendar.


# Contributing

Coming to a readme close to you soon..

# Copyright & License

Coming to a readme close to you soon..

# References & Sources

https://developers.google.com/google-apps/calendar/
https://console.developers.google.com/
http://simplyapps.nl/MagisterJS/docs/
