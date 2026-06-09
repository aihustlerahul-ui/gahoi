# Expo Cost Optimization & Self-Hosting Guide

This document outlines strategies to run, build, and update your Expo applications while keeping platform costs at **$0 (completely free)** by bypassing proprietary Expo Application Services (EAS) charges.

---

## 1. Local Builds vs. EAS Build

EAS Build runs iOS and Android compilation in the cloud. On the free tier, these builds are subjected to shared queues (long wait times) and monthly volume caps.

### The $0 Solution: Local CLI Builds
Build your application binaries on your local computer. This uses your own hardware resources with no limits, queues, or costs.

#### Prerequisites
*   **Android:** Install JDK (Java Development Kit) and Android SDK.
*   **iOS:** Requires macOS with Xcode installed.

#### Commands
*   **Compile Android Release Build (APK/AAB):**
    ```bash
    npx expo run:android --variant release
    ```
*   **Compile iOS Release Build (IPA):**
    ```bash
    npx expo run:ios --configuration Release
    ```

---

## 2. Self-Hosted Over-The-Air (OTA) Updates

EAS Update allows pushing JavaScript/TypeScript bug fixes directly to user devices. However, the free tier caps usage at **1,000 Monthly Active Users (MAU)**.

### The $0 Solution: Custom Endpoint Hosting
You can host update bundles on any free static file server (e.g., GitHub Pages, Vercel, Netlify, Cloudflare Pages, or AWS S3/Cloudflare R2 free tiers) using the Expo updates protocol.

#### How It Works
1.  **Export the Bundle:** Generate static assets and bundle manifests locally.
    ```bash
    npx expo export
    ```
    This outputs your code, assets, and metadata into a `dist/` directory.
2.  **Deploy:** Upload the contents of the `dist/` directory to your static hosting provider (e.g., `https://my-free-bucket.netlify.app`).
3.  **Configure `app.json`:** Tell the Expo Updates client to fetch updates from your custom URL instead of EAS:
    ```json
    {
      "expo": {
        "updates": {
          "url": "https://my-free-bucket.netlify.app/metadata.json"
        }
      }
    }
    ```

---

## 3. Free Cloud Builds via GitHub Actions

If you do not own a Mac to compile iOS builds locally, or want a centralized deployment pipeline, you can use **GitHub Actions**.

### The $0 Solution: Free CI/CD Minutes
GitHub offers free runner minutes for public repositories and 2,000 minutes/month for private repositories, which is more than enough for small to medium projects.

#### Example Workflow Structure
You can set up a GitHub workflow (`.github/workflows/build.yml`) that:
1.  Clones your repository.
2.  Installs Node.js, SDKs, and project dependencies.
3.  Runs `npx expo prebuild` to generate the native `/ios` and `/android` directories.
4.  Compiles the codebase using Xcode command-line tools or Gradle.
5.  Uploads the resulting `.ipa` or `.apk`/`.aab` as a build artifact.

---

## 4. Free Push Notifications

EAS Push Notifications relay notifications through Expo's servers, which may introduce future pricing thresholds or rate limits.

### The $0 Solution: Direct Firebase & APNs Integration
Connect directly to native notification providers:
*   **Android:** Firebase Cloud Messaging (FCM) — Free at any scale.
*   **iOS:** Apple Push Notification service (APNs) — Included with your Apple Developer Membership.

Use the official React Native Firebase library:
```bash
npx expo install @react-native-firebase/app @react-native-firebase/messaging
```
This bypasses Expo servers completely, sending notification payloads directly from your backend database to FCM/APNs.
