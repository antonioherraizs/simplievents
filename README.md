# SimpliEvents
An event viewer for users of the [SimpliSafe&trade;](http://www.simplisafe.com) home alarm system.

Built with [Codiqa.com](http://www.codiqa.com) + PhoneGap 3.1.0.

Uses some cool libraries and plugins, check out the [js](www/js) directory.

## How to Fork

This repo implements the concept of login into a site, retrieving data from a `<table>` and displaying it as a ListView in a PhoneGap app. Therefore it can be adapted to any other similar use case with little effort. Most of the customizations can be removed without affecting the main app behavior.

It's not using any custom icons or graphics so in order to convert it into another app the files to modify are `www/index.html` and `js/simplievents.js` plus some other minor changes here and there to change the name of the app, etc.

## How to build for Android

1. Clone repo
```sh
$ git clone https://github.com/antonioherraizs/simplievents myappdirname
```

1. Create PhoneGap app
```sh
$ phonegap create myappdirname
```

1. PhoneGap overwrites some of our repo files so reset them
```sh
$ cd myappdirname
$ git reset HEAD --hard
$ git clean -fd
```

1. Build and install. This step requires the [Android ADT Bundle](http://developer.android.com/sdk/index.html) or equivalent and the [Java SDK](http://www.oracle.com/technetwork/java/javase/downloads/index.html) to be in the `PATH`, and a development phone plugged in:
```sh
$ phonegap local run android
```

## How to build for iOS
I haven't tried.

## TOFIX

- ~~List doesn't come up after failed login + successful login~~
- ~~Allow logging out from main page~~
- Buttons need to lose focus after being clicked

## TODO
- Rename labels with more user-friendly names
- Add features:
  - ~~pull events from all pages or until a max is reached~~
  - export as HTML/PDF/CSV
  - Notifications
