# Juqe
*A collaborative song voting system for parties, powered by Spotify.*

## Features

- Allow party guests to queue and vote for music by visiting a web app on their mobile phones
- Auto-play a default playlist when no songs have been queued
- Supports playback from any device (not just the device Juqe is running on)
- Crossfade support

## Screenshots
![Screenshots](https://raw.githubusercontent.com/willfiore/juqe/master/screenshots/shot1.png)

## Setup
1. Clone the repo to a desired installation directory
1. Install [Node.js](https://nodejs.org/)
1. Create a developer app for Spotify [here](https://developer.spotify.com/dashboard/applications)
    - Set the `Redirect URIs` field to `http://localhost/auth/`
1. Edit the settings file **settings.toml** found in the repo root directory, specifying the *Client ID* and *Client Secret* associated with your new Spotify app

*An example settings.toml:*
```toml
[spotify]
clientID = "f06edea779e8a25dd43569d4b99733a2"
clientSecret = "2293b9e4e82804b90eeb805b52031338b6"

[network]
webPort = 80
webSocketPort = 8080

...
```
### Note
If you change `webPort` in **settings.toml**, remember to change the `Redirect URIs` field in your Spotify app to match the Web server port (*e.g. `http://localhost:9000/auth/` for `webPort = 9000`*)

---

## Usage
1. Run Juqe with `npm start`
1. Authorize your Spotify premium account
1. Begin playing the auto-generated Juqe playlist through Spotify on any device
1. Direct party guests to the Web server hosted by Juqe where they can search for music to queue up, as well as vote on other people's suggestions

## Known issues
Due to [a bug](https://github.com/spotify/web-api/issues/537) in the Spotify
Web API, the auto-generated Juqe playlist must be manually played from the
Spotify app when Juqe is started, otherwise tracks will not be queued.

## Todo
- Wrap executable (with Electron front end?)
- Time-limit queue and heart requests per user
