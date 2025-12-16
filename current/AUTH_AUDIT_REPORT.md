# Authentication & Security Audit Report

> **Date:** 2025-12-08
> **Auditor:** Antigravity (AI System Implementation)
> **Status:** Review Required

## 1. Executive Summary
A comprehensive security audit was conducted on the KeenVPN authentication and session management infrastructure. The audit covered the Backend Service (`vpn-backend-service`), Android Client (`vpn-android-app`), and iOS Client (`vpn-ios-app`).

**Result:** 🔴 **FAIL** (CRITICAL Vulnerabilities Found)

The system currently violates core VPN security principles ("Zero-Knowledge") and contains critical implementation flaws in credential storage on Android and Backend configuration.

## 2. Vulnerability Matrix

| ID | Severity | Component | Issue | Remediation |
|----|----------|-----------|-------|-------------|
| **V-01** | 🚨 **CRITICAL** | Android | **Insecure Encryption Key Storage**<br>The AES key used to encrypt user credentials is stored in the *same* SharedPreferences file as the encrypted data. | Use Android Keystore System for key management. |
| **V-02** | 🚨 **CRITICAL** | Backend | **Default JWT Secret**<br>`src/utils/auth.ts` uses a hardcoded fallback `'your-secret-key'` which may be active in production if env vars fail. | Enforce process exit if `JWT_SECRET` is missing. Rotate keys immediately. |
| **V-03** | 🔴 **HIGH** | Privacy | **Identity-Traffic Linkage**<br>`ConnectionSession` table has a hard Foreign Key to `User` table, permanently linking browsing metadata to Payment/Email identity. | Remove `userId` from usage logs. Use "Blind Tokens" or aggregated anonymous stats. |
| **V-04** | 🟡 **MEDIUM** | Android | **Cleartext Traffic Enabled**<br>`usesCleartextTraffic="true"` in Manifest allows HTTP connections. | Set to `false` and use Network Security Config to whitelist specific domains if needed. |
| **V-05** | 🟢 **LOW** | Backend | **Token Expiration Misnomer**<br>`generatePermanentSessionToken` implies non-expiry but sets `30d`. | Rename function to `generateLongLivedToken` or implement Refresh Tokens. |

## 3. Detailed Findings

### A. Android Credential Storage (V-01)
*   **File:** `VPNConfigurationManager.kt`
*   **Analysis:** The `getOrCreateEncryptionKey()` method generates an AES key and saves it to `SharedPreferences`. The `storeVPNCredentials()` method uses this key to encrypt the password and saves it to the *same* `SharedPreferences`.
*   **Exploit:** An attacker with root access or a malicious app with file access (via backup/restore exploits) can read both the ciphertext and the key, instantly decrypting the user's VPN credentials.
*   **Recommendation:** rewrite to use `EncryptedSharedPreferences` (part of Jetpack Security) which utilizes the hardware-backed Android Keystore.

### B. "Zero-Knowledge" Violation (V-03)
*   **File:** `prisma/schema.prisma`
*   **Analysis:**
    ```prisma
    model ConnectionSession {
      userId  String  @map("user_id") // <-- Direct Link
      user    User    @relation(fields: [userId], references: [id])
      // ...
    }
    ```
*   **Impact:** A database seizure or leak would reveal exactly when a specific person (identified by Stripe/Email in `User` table) was connected to the VPN, for how long, and via which server `serverAddress`. This breaks the "No Logs" promise.
*   **Recommendation:**
    1.  Decouple Auth from Usage.
    2.  When a user starts a session, validate their token but do NOT record the `userId` in the `ConnectionSession` log.
    3.  If bandwidth tracking is required, use a hashed or rotating ephemeral ID that cannot be reversed to the User ID.

### C. Backend Configuration (V-02)
*   **File:** `src/utils/auth.ts`
*   **Code:** `const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';`
*   **Risk:** If the environment variable is not set (e.g., in a new deployment or CI/CD error), the app defaults to a known public secret, allowing anyone to forge session tokens to bypass payment checks (`requirePaidOrTrial`).

## 4. iOS Compliance
*   **Status:** ✅ **PASS**
*   **Analysis:** The iOS client in `VPNManager.swift` correctly uses `NEVPNProtocolIKEv2`'s `passwordReference` property. This ensures the password is managed by the system Keychain and never exposed in the app's memory or storage.

## 5. Next Actions
1.  **Immediate**: Fix V-02 (Backend JWT) and V-01 (Android Storage).
2.  **Short Term**: Refactor Database Schema to break the `User` -> `ConnectionSession` link (V-03).
3.  **Process**: Establish a "Privacy Review" gate for all future database migrations.
