# ShapeFit Mobile App - Deployment Guide

## Prerequisites

### Required Tools
- **Node.js** 16+ and npm
- **Expo CLI** - Install globally: `npm install -g eas-cli`
- **Expo Account** - Free account at https://expo.dev
- **Android Studio** - For local builds (optional)
- **Android Device/Emulator** - For testing
- **Backend Server** - Running Docker or deployed

### Optional Tools
- **Expo Go** - Easiest way to test on physical device
- **Git** - For version control

---

## Configuration

### 1. API Configuration

Update `mobile/src/api/client.ts` based on your environment:

```typescript
// For Android Emulator (most common for development)
const API_BASE_URL = 'http://10.0.2.2:8000';

// For iOS Simulator
const API_BASE_URL = 'http://localhost:8000';

// For Physical Device (on same network)
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8000';

// For Production
const API_BASE_URL = 'https://your-api-domain.com/api';
```

**To find your computer's IP:**
- Windows: Open Command Prompt → `ipconfig` → Look for IPv4 Address
- Mac/Linux: Open Terminal → `ifconfig` or `ip addr`

**To test backend accessibility:**
```bash
# From your computer
curl http://localhost:8000/

# From another device
curl http://YOUR_COMPUTER_IP:8000/
```

### 2. Expo Configuration

Ensure `mobile/app.json` is properly configured:

```json
{
  "expo": {
    "name": "ShapeFit",
    "slug": "shapefit",
    "version": "1.0.0",
    "android": {
      "package": "com.shapefit.app",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.shapefit.app"
    },
    "plugins": [
      "expo-camera"
    ],
    "extra": {
      "eas": {
        "projectId": "shapefit-fitness-tracker"
      }
    }
  }
}
```

---

## Deployment Methods

### Method 1: Expo EAS Build (Recommended) ⭐

**Best for:**
- Quick APK distribution
- Testing on physical devices
- Internal testing (up to 30 testers)

**Setup:**

#### Step 1: Install Expo CLI
```bash
npm install -g eas-cli
npm install -g expo
```

#### Step 2: Login to Expo
```bash
expo login
```
This will open your browser to authenticate.

#### Step 3: Configure EAS Build
```bash
cd mobile
eas build:configure
```

Follow the prompts:
1. Choose platform: Android
2. Choose build profile: Preview
3. Configure as needed

#### Step 4: Build APK
```bash
# Preview APK (for testing)
npm run build:android

# Production APK (for Play Store)
npm run build:android:prod

# Both Android and iOS
npm run build:all
```

**Build time:** ~5-15 minutes

#### Step 5: Download APK

After successful build, you'll see:
```
✅ Build finished
→ Your build is ready!

Build details
Platform: Android
Project: shapefit
Build profile: preview
Distribution: internal
→ Download your build from:
https://expo.dev/accounts/[your-account]/projects/shapefit/builds/[build-id]

Your artifact is ready:
- https://expo.dev/artifacts/[apk-file].apk
```

Download the APK and install on your Android device.

### Method 2: Expo Go (Fastest for Testing) 🚀

**Best for:**
- Testing on physical device WITHOUT building
- Quick iteration
- Internal testing

**Setup:**

#### Step 1: Install Expo Go App
- Download from Google Play Store (Android)
- Download from App Store (iOS)
- Login to your Expo account

#### Step 2: Add Project to Expo Go
- Open Expo Go app
- Tap "+" to add project
- Choose "Use existing project"
- Select your "shapefit" project

#### Step 3: Run on Device
```bash
cd mobile
expo start
```

1. Scan QR code with Expo Go app
2. App will open and connect to your dev server
3. See changes in real-time!

**Benefits:**
- No build required
- See changes instantly
- Test with real device
- Access to dev tools

### Method 3: Local Build with Android Studio

**Best for:**
- Full control over build process
- Debugging native modules
- Custom build configurations

**Setup:**

#### Step 1: Install Android Studio
- Download from https://developer.android.com/studio
- Install Android SDK and build tools

#### Step 2: Prebuild the Project
```bash
cd mobile
npx expo prebuild --clean
```

This creates an `android/` folder with native code.

#### Step 3: Open in Android Studio
1. Open Android Studio
2. Choose "Open an Existing Project"
3. Select `mobile/android` folder
4. Wait for Gradle sync

#### Step 4: Run on Device
1. Connect Android device via USB
2. Click "Run" button in Android Studio
3. App will install on device

### Method 4: Expo Development Build (Manual)

**Best for:**
- Understanding native code
- Custom native modules
- Debugging native crashes

**Setup:**

```bash
cd mobile
eas build --platform android --profile development --local
```

This builds locally on your machine using Android Studio/Gradle.

---

## Development Workflow

### Testing on Android Emulator

#### Start Backend
```bash
cd D:\shapefit2
docker-compose up
```

#### Start Mobile Development
```bash
cd D:\shapefit2\mobile

# Update API URL for emulator
# Edit src/api/client.ts:
# const API_BASE_URL = 'http://10.0.2.2:8000';

npm start
```

#### Start Emulator
```bash
# Option 1: Through Android Studio
# Option 2: Through VS Code (with React Native Tools extension)
```

#### Scan QR in Expo DevTools
1. Open http://localhost:19002 (adjust if different)
2. Click "Run on Android Device/Emulator"

### Testing on iOS Simulator

```bash
cd D:\shapefit2\mobile

# Update API URL for simulator
# Edit src/api/client.ts:
# const API_BASE_URL = 'http://localhost:8000';

npm start
```

Press `i` in Expo DevTools to start iOS simulator.

### Testing on Physical Device (Android)

#### Option 1: Using Expo Go
```bash
# 1. Install Expo Go app on phone
# 2. Start development server
cd mobile
npm start

# 3. Scan QR code with Expo Go
```

#### Option 2: Using EAS Build
```bash
# 1. Build APK
npm run build:android

# 2. Download and install APK

# 3. Test all features
```

---

## Production Deployment

### Android Play Store

#### Step 1: Create Google Play Console Account
- Go to https://play.google.com/console
- Create developer account ($25 one-time fee)
- Create app

#### Step 2: Configure Signing
```bash
# Create keystore
keytool -genkey -v -keystore shapefit.keystore -alias shapefit -keyalg RSA -keysize 2048 -validity 10000 -storepass shapefit123 -keypass shapefit123

# Export certificate
keytool -export -keystore shapefit.keystore -alias shapefit -file shapefit.cer

# Get SHA-1 fingerprint
keytool -list -v -keystore shapefit.keystore -alias shapefit
```

#### Step 3: Build Production APK
```bash
npm run build:android:prod
```

#### Step 4: Upload to Play Console
- Upload AAB (App Bundle) from build
- Fill store listing information
- Upload screenshots (required)
- Submit for review

#### Step 5: Review Process
- Takes 1-3 days typically
- Once approved, app is live!

### iOS App Store

#### Step 1: Apple Developer Account
- Enroll in Apple Developer Program ($99/year)
- Create App ID in App Store Connect

#### Step 2: Configure Build
```bash
npm run build:ios
```

#### Step 3: Upload to App Store Connect
- Upload IPA file
- Fill app information
- Upload screenshots
- Submit for review

#### Step 4: Review Process
- Takes 1-2 days typically

---

## Troubleshooting

### Build Issues

**Error: "Project not configured for EAS"**
```bash
eas build:configure
```

**Error: "No matching Android build profile"**
- Check `eas.json` configuration
- Ensure build profile exists in `app.json`

**Error: "Gradle build failed"**
- Check Android SDK version
- Check dependencies in `package.json`
- Try with `eas build --platform android --clear-cache`

### Run-time Issues

**Error: "Network request failed"**
```bash
# Check API URL in src/api/client.ts
# Ensure backend is running
# Test with curl:
curl http://YOUR_API_URL:8000/
```

**Error: "Camera permission denied"**
- Check permissions in `app.json`
- Ensure user granted camera permission
- Reinstall app if needed

**Error: "Expo Go can't connect"**
- Ensure both devices on same network
- Check firewall settings
- Restart Expo Go app

### Device Issues

**App not installing on device**
- Enable "Unknown sources" in Android Settings
- Allow installation from this source

**App crashes on launch**
- Check logs in `adb logcat`
- Verify backend connection
- Test with simpler build first

---

## Scripts Reference

### Available Scripts

```bash
# Start development server
npm start

# Android specific
npm run android
npm run build:android
npm run build:android:prod

# iOS specific
npm run ios
npm run build:ios

# Build all platforms
npm run build:all

# Lint and type checking
npm run lint
npm run typecheck

# Configure EAS
npm run configure
```

---

## Quick Start Commands

### For Development
```bash
# 1. Start backend
cd D:\shapefit2
docker-compose up

# 2. Start mobile
cd D:\shapefit2\mobile
npm start

# 3. Open Expo DevTools
# Automatically opens at http://localhost:19002

# 4. Press 'a' for Android or 'i' for iOS
```

### For Building APK
```bash
cd D:\shapefit2\mobile

# Build preview APK
npm run build:android

# Build production APK
npm run build:android:prod

# Or use EAS directly
eas build --platform android --profile preview
```

### For Testing on Physical Device (Fastest)
```bash
cd D:\shapefit2\mobile
npm start

# Then:
# 1. Install Expo Go app on phone
# 2. Scan QR code from terminal
```

---

## Checklist

### Pre-Deployment
- [ ] Backend server running
- [ ] API accessible from device
- [ ] app.json configured
- [ ] eas.json configured
- [ ] Assets (icon, splash) created
- [ ] All features tested

### Build
- [ ] EAS CLI installed
- [ ] Logged in to Expo
- [ ] Project configured for EAS
- [ ] Build successful
- [ ] APK downloaded

### Testing
- [ ] App installs successfully
- [ ] Can register/login
- [ ] Can scan QR code
- [ ] Can add exercises
- [ ] Can log body metrics
- [ ] Can view history
- [ ] Works on emulator
- [ ] Works on physical device

---

## Next Steps After Deployment

1. **Test all features** thoroughly
2. **Collect feedback** from testers
3. **Fix bugs** and iterate
4. **Prepare store listings**
5. **Submit to stores** (for production)

---

## Getting Help

- **Expo Documentation:** https://docs.expo.dev/
- **EAS Build Docs:** https://docs.expo.dev/build/introduction
- **React Native Docs:** https://reactnative.dev/
- **Expo Forums:** https://forums.expo.dev/

---

**Happy deploying! 🚀**
