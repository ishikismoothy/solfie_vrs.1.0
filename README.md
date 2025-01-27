# solfie

## Project setup
```
npm install
```

## Download all dependancies
```
npm install vue-draggable-next
npm install vue-chartjs chart.js
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Firebase Emulator Setup
```
brew install openjdk@17
```

## Run Firebase Emulator
```
Firebase emulators:start
```
You will need to do several extra steps before starting the emulator for the first time.

## Firebase Setup
```
npm install -g firebase-tools
```

## Login to Firebase
```
cd [to your project]
firebase login
firebase login -reauth
```

## Initialise firebase
```
firebase init
```
1) Select "Hosting"
2) What do you want to use as your public directory? dist
3) Configure as a single-page app (rewrite all urls to /index.html)? Yes
4) Set up automatic builds and deploys with GitHub? No

## Host App on firebase
```
firebase deploy --only hosting
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
# solfie_vrs.1.0
Soflie web based app version 1.0
