# Enabling the Google Calendar API
Before being able to use Magister Calendar, you'll have to [enable the Google Calendar API](https://console.developers.google.com/flows/enableapi?apiid=calendar) through the Google Developer Console. This tutorial will help you get through the maze of Google's Developer Console.

## 1. Head over to the Developer Console
Open up your browser and head to https://console.developers.google.com/flows/enableapi?apiid=calendar.
You'll see something similar to the image below. You will have to click `Agree and Continue` to be able to start using Google's APIs.

![Enable API](http://img.prntscr.com/img?url=http://i.imgur.com/VHo30ws.png)

## 2. Create new project
When clicking Agree and Continue, Google will create your new project called My Project. When that's done, it'll prompt you to `Go to [your] Credentials`. Click `Add Credentials` and then select `OAuth 2.0 Client ID` from the dropdown menu.

![Add Credentials](http://img.prntscr.com/img?url=http://i.imgur.com/N4YlPOr.png)

## 3. Configure consent screen
The website will say that you first need to add a Product name before you can continue.
Go ahead and configure your Consent screen. You have to set `Magister Calendar` as the product name, 
all the other options are mandatory. When that's done, hit the save button and wait for the site to get back to the Create Client ID screen. 

![Create Client ID](http://img.prntscr.com/img?url=http://i.imgur.com/FUXOdfg.png)

## 4. Create Client ID
Select the `Web application` option and fill in `Magister Calendar` as the name (This has to be the exact same as the product name of the consent screen). The last thing you'll have to fill in is the Authorized redirect URI. You can set this to a phony URL, for example `http://localhost/authcallback`, or to `https://lesander.me/gauthhelper.html` to be able to read the auth key easily (more on that later in the readme).
When that's all done, hit the Done button.

![Create Client ID Application name](http://img.prntscr.com/img?url=http://i.imgur.com/Evq752L.png)

## 5. View Client Secret & ID
Great, you've just created your application at the Google Developers Console. You'll now be shown your `Client Secret` and `Client ID`. This is important stuff, you'll be able to find these values back later in the overview of all your OAuth Client IDs.

![Client Secret and Client ID](http://img.prntscr.com/img?url=http://i.imgur.com/d0lZcVR.png)

## 6. Open OAuth overview
Click OK and you will see an overview of all your OAuth Client IDs. Click on the Magister Calendar one.

![Client ID overview](http://img.prntscr.com/img?url=http://i.imgur.com/6A3orXA.png)

## 7. Download JSON credentials
We will need the credentials in JSON format, so download the ID and secret by clicking `Download JSON`.

![Download JSON](http://img.prntscr.com/img?url=http://i.imgur.com/21Bf2m3.png)

--

When you have completed all of the steps above, you can [go back to the README](https://github.com/lesander/magister-calendar#2-download-magister-calendar) to continue installing Magister Calendar.
