# Google Play Store Data Safety Specification

**Application Name:** Lewi House Kosan Management  
**Package Name:** `lewihouse.android`  
**Target SDK:** 35 (Android 15)  
**Encryption Standard:** AndroidX Security Crypto (`AES256_GCM` / `AES256_SIV`) + TLS 1.3 in Transit

---

## 1. Overview & Data Handling Policy

| Question | Answer | Details |
| :--- | :--- | :--- |
| **Does your app collect or share user data?** | **Yes** | Required for property management, user authentication, and billing. |
| **Is all user data encrypted in transit?** | **Yes** | All network traffic uses HTTPS/TLS 1.3 enforced by `network_security_config.xml`. |
| **Do you provide a way for users to request data deletion?** | **Yes** | In-app account deletion & GDPR/CCPA removal request endpoint. |
| **Is local data encrypted at rest?** | **Yes** | Keystore-backed `EncryptedSharedPreferences` (`AES256_GCM`). |

---

## 2. Collected Data Types & Purposes

### A. Personal Info
* **Name & Email Address:**
  * **Collected:** Yes
  * **Shared with 3rd parties:** No
  * **Purpose:** App functionality, Account management, Resident identification.
  * **Optional / Required:** Required for account creation and login.
* **Phone Number:**
  * **Collected:** Yes
  * **Shared with 3rd parties:** No
  * **Purpose:** Emergency contacts and WhatsApp/SMS billing notifications.

### B. Financial Info
* **Payment History & Rent Receipts:**
  * **Collected:** Yes
  * **Shared with 3rd parties:** No
  * **Purpose:** Kosan rental accounting, PLN electricity token purchase logs, proration calculation.

### C. Photos and Videos
* **Maintenance & Repair Photos:**
  * **Collected:** Yes (when tenant attaches photo to repair ticket)
  * **Shared with 3rd parties:** No
  * **Purpose:** Facility issue reporting and repair verification.

### D. App Activity & Diagnostics
* **Crash Logs (Firebase Crashlytics):**
  * **Collected:** Yes
  * **Shared with 3rd parties:** No (sent to Google Firebase services only)
  * **Purpose:** Analytics, Crash reporting, Stability monitoring (Anonymized, Non-PII).
* **Performance Info (Firebase Performance Monitoring):**
  * **Collected:** Yes
  * **Purpose:** Network latency measurement, App startup time.

### E. Device Identifiers
* **FCM Registration Token & Device ID:**
  * **Collected:** Yes
  * **Purpose:** Push notifications for announcements, rent due reminders, and direct chat messages.

---

## 3. Security Practices Enforced in Codebase
1. **Zero Cleartext Traffic:** `android:usesCleartextTraffic="false"` declared in `AndroidManifest.xml`.
2. **Hardware-Backed Encryption:** Tokens and session secrets are encrypted using Android Keystore `MasterKey`.
3. **App Integrity:** Firebase App Check with Play Integrity prevents unauthorized client spoofing.
4. **Role-Based Access Control:** Cloud Firestore Security Rules ensure tenants cannot read or write records of other residents.
