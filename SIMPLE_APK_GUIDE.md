# 📱 Easy Guide: Convert to Mobile APK

## 🎯 Quick Overview
This guide will help you turn your Pennywise Planner into a real Android app (APK file) that you can install on your phone!

---

## ✅ What You Need (One-Time Setup)

1. **A Computer** (Windows, Mac, or Linux)
2. **Node.js** - Download from [nodejs.org](https://nodejs.org/) (choose LTS version)
3. **Android Studio** - Download from [developer.android.com](https://developer.android.com/studio)
4. **Git** - Download from [git-scm.com](https://git-scm.com/)

---

## 🚀 Step-by-Step Instructions

### Step 1: Get Your Code
1. Click **"Export to GitHub"** button (top right in Lovable)
2. Connect your GitHub account and create a repository
3. Open Terminal/Command Prompt and run:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

### Step 2: Install Everything
```bash
npm install
```
Wait for it to finish (might take a few minutes).

### Step 3: Add Android Platform
```bash
npx cap add android
```

### Step 4: Build Your App
```bash
npm run build
npx cap sync
```

### Step 5: Open in Android Studio
```bash
npx cap open android
```
Android Studio will open your project.

### Step 6: Create APK

**For Testing (Quickest Way):**
1. In Android Studio, click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for "Build Successful" notification
3. Click **"locate"** to find your APK
4. Your APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`

**For Production (To Share with Others):**
1. Click **Build** → **Generate Signed Bundle / APK**
2. Select **APK** → Click **Next**
3. Click **Create new...** to make a keystore (save it safely!)
4. Fill in the details and click **OK**
5. Select **release** → Click **Finish**
6. Find APK at: `android/app/release/app-release.apk`

---

## 📲 Install APK on Your Phone

### Method 1: Direct Transfer
1. Copy the APK file to your phone (USB, email, WhatsApp, Google Drive)
2. Open the APK file on your phone
3. Allow "Install from Unknown Sources" if asked
4. Tap **Install**

### Method 2: USB Install (Fastest)
1. Enable **Developer Options** on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable **USB Debugging** in Developer Options
3. Connect phone to computer with USB cable
4. Run:
   ```bash
   npx cap run android
   ```

---

## 🔧 Common Issues & Fixes

### "SDK location not found"
Create a file named `local.properties` in the `android` folder:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```
(Path will be different on Windows/Linux - check Android Studio preferences)

### "App won't install"
- Make sure "Install from Unknown Sources" is enabled
- Try uninstalling any old version first

### "Build failed"
- Make sure you ran `npm install` first
- Try closing and reopening Android Studio
- Run `npx cap sync` again

---

## 🎉 What About SMS Auto-Import?

The SMS auto-import feature will **ONLY work** after you:
1. Build the APK (following steps above)
2. Install it on your phone
3. Grant SMS permissions when the app asks

**New Features Included:**
- ✅ **Automatic Duplicate Detection** - Won't import the same transaction twice
- ✅ **Manual SMS Import** - Paste SMS text manually if needed
- ✅ **Smart Bank Recognition** - Recognizes major Indian banks automatically
- ✅ **Auto Account Creation** - Creates bank accounts automatically from SMS

It won't work in the browser - it needs to be a real app on your phone!

---

## 🌐 Production Build (Important!)

Before creating your final APK, edit `capacitor.config.ts`:

**Change this:**
```typescript
server: {
  url: 'https://3bf4ca69-0cfa-4dc2-bd7f-59d22f33b091.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

**To this (remove the server section completely):**
```typescript
// Remove the entire server section for production
```

This makes your app work offline and load instantly!

---

## 📱 Need More Help?

- **Capacitor Docs**: [capacitorjs.com/docs](https://capacitorjs.com/docs)
- **Android Studio Guide**: [developer.android.com/studio/intro](https://developer.android.com/studio/intro)
- **Lovable Community**: [discord.gg/lovable](https://discord.gg/lovable)

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Initial setup
npm install
npx cap add android

# After code changes
npm run build
npx cap sync

# Open in Android Studio
npx cap open android

# Install on connected phone
npx cap run android
```

---

That's it! 🎊 You now have a real Android app!
