# Convert Your Budget Tracker to Mobile APK

Follow these steps to convert your web app to a native Android APK:

## Prerequisites
- A computer (Windows, Mac, or Linux)
- Node.js installed (version 16 or higher)
- Android Studio installed
- Git installed

## Step 1: Export to GitHub
1. In your Lovable project, click the **"Export to GitHub"** button in the top right
2. Follow the prompts to connect your GitHub account and create a repository
3. Once exported, clone the repository to your local computer:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Add Capacitor Platforms
The Capacitor dependencies are already added to your project. Now add the Android platform:

```bash
npx cap add android
```

For iOS (Mac only with Xcode):
```bash
npx cap add ios
```

## Step 4: Build Your Web App
```bash
npm run build
```

## Step 5: Sync with Capacitor
This copies your built web app to the native platforms:
```bash
npx cap sync
```

## Step 6: Open in Android Studio
```bash
npx cap open android
```

This will open your project in Android Studio.

## Step 7: Build APK in Android Studio

### Option A: Debug APK (for testing)
1. In Android Studio, click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for the build to complete
3. Click **"locate"** in the notification to find your APK
4. The APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`
5. Transfer this APK to your phone and install it

### Option B: Release APK (for distribution)
1. First, generate a keystore for signing:
   ```bash
   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```
2. In Android Studio, click **Build** → **Generate Signed Bundle / APK**
3. Select **APK** and click Next
4. Browse to your keystore file and enter your passwords
5. Choose **release** build variant
6. Click Finish
7. Find your signed APK in: `android/app/release/app-release.apk`

## Step 8: Install on Your Phone

### Via USB:
1. Enable **Developer Options** on your phone
2. Enable **USB Debugging**
3. Connect phone to computer
4. Run: `npx cap run android`

### Via APK File:
1. Transfer the APK to your phone (email, Google Drive, etc.)
2. Open the APK file on your phone
3. Allow installation from unknown sources if prompted
4. Install the app

## Troubleshooting

### "SDK location not found"
Create a `local.properties` file in the `android` folder:
```
sdk.dir=/path/to/your/Android/sdk
```

### "Gradle sync failed"
Open Android Studio and let it download required components automatically.

### "App not installing on phone"
Make sure "Install from Unknown Sources" is enabled in your phone's security settings.

## Hot Reload Development (Optional)
The app is configured to load from the Lovable preview URL for development:
- This allows you to see changes instantly without rebuilding
- For production, change the URL in `capacitor.config.ts` to your deployed site

## Publishing to Google Play Store
1. Create a Google Play Developer account ($25 one-time fee)
2. Generate a signed release APK (Option B above)
3. Upload to Google Play Console
4. Fill in app details, screenshots, and descriptions
5. Submit for review

## Need Help?
- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio Guide: https://developer.android.com/studio
- Lovable Discord: https://discord.gg/lovable
