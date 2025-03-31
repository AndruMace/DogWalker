# Android Setup for DogDash

This document provides instructions for setting up the Android version of DogDash.

## Google Maps API Key

To use Google Maps on Android, you need to obtain a Google Maps API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the Google Maps Android API
4. Create credentials to get an API key
5. Restrict the API key to Android applications using your app's package name and SHA-1 certificate fingerprint

## Adding your API key to the app

Once you have your API key, add it to the AndroidManifest.xml file:

1. Open `android/app/src/main/AndroidManifest.xml`
2. Find the following meta-data tag:
   ```xml
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE" />
   ```
3. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key

## Additional Android Setup

For Android 10+ (API level 29+), you need to grant background location permission manually:

1. Open your app settings
2. Go to Permissions
3. Select Location
4. Choose "Allow all the time" to enable background location tracking

## Building for Android

To build and run the app on Android:

```bash
npm run android
```

Or with Expo:

```bash
npx expo run:android
``` 