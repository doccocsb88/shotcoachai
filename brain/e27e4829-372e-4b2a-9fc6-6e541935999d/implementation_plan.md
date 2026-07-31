# [Migrate Usage Tracking to Encrypted Storage with Auto Backup]

The current implementation of tracking user usage relies on `AsyncStorage`, which saves data in plain text in the Android SharedPreferences directory. This makes it highly vulnerable to being reset when a user simply clears the app data.

To mitigate this without introducing a complex backend like Firebase, we will migrate to a local-first secure storage approach.

## Proposed Changes

### 1. Install Dependencies
We will install:
- `react-native-encrypted-storage`: This library uses the Android Keystore system (EncryptedSharedPreferences) to securely store data. It provides a drop-in replacement for AsyncStorage. This adds an extra layer of difficulty for users trying to bypass limits.

### 2. Configure Android Manifest for Auto Backup
We will verify and configure `AndroidManifest.xml` to ensure `android:allowBackup="true"` is enabled. 
- With Auto Backup enabled, Android automatically uploads the app's SharedPreferences to the user's Google Drive. 
- If a user clears the app data and reopens the app (or uninstalls and reinstalls), Android will silently restore the backed-up data from Google Drive, thereby restoring their consumed usage limits.

### 3. Core Service Changes

#### [MODIFY] [UserManager.ts](file:///Users/mac/Documents/hai/ShotCoach AI/src/services/user/UserManager.ts)
We will refactor `ShotCoachUserManager` to read and write from `EncryptedStorage` instead of `AsyncStorage`.
- Replace all `AsyncStorage.getItem` and `AsyncStorage.setItem` calls with `EncryptedStorage.getItem` and `EncryptedStorage.setItem`.

## User Review Required
> [!IMPORTANT]
> The app needs to be recompiled (`npm run android`) after adding `react-native-encrypted-storage` because it includes native code.
> Please review and approve this plan.

## Verification Plan
### Automated Tests
- N/A

### Manual Verification
1. I will rebuild and restart the Android app.
2. I will verify that `UserManager` successfully persists and reads the tracking limits via `react-native-encrypted-storage`.
