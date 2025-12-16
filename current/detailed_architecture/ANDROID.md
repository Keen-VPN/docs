# Android Client Architecture

## 1. Overview
The Android client (`vpn-android-app`) is a native Kotlin application following MVVM architecture. It utilizes the Android `VpnService` API to establish IKEv2 IPSec tunnels.

*   **Min SDK**: 30 (Android 11)
*   **Target SDK**: 34
*   **UI**: XML Layouts + ViewBinding
*   **Crypto**: BouncyCastle (`bcprov`, `bcpkix`)

## 2. VPN Implementation

### `IKEv2VPNService`
The core service extending `android.net.VpnService`.
*   **Lifecycle**:
    *   `onCreate()`: Initializes Notification Channel (`IKEV2_VPN_SERVICE_CHANNEL`).
    *   `onStartCommand()`: Handles `CONNECT`/`DISCONNECT` intents.
    *   `onDestroy()`: Cleans up the tunnel interface.
*   **Tunneling**:
    *   Currently uses a `SimpleTunnel` implementation which appears to be a simulation/proxy wrapper around the file descriptor.
    *   **Critical Finding**: In `IKEv2VPNService.kt`, the packet processing loop reads from the `vpnInterface` file descriptor and writes to a `SimpleTunnel`.
    *   **Network Config**:
        *   MTU: 1400
        *   DNS: 8.8.8.8, 8.8.4.4
        *   Address: 10.0.0.2/32

### Manifest Configuration
*   **Permissions**: `FOREGROUND_SERVICE`, `INTERNET`.
*   **Service Declaration**: *Missing/Ambiguous in initial analysis*. The service should be declared with `android.permission.BIND_VPN_SERVICE`. The absence suggests it might be injected via a merge manifest or is a point of failure to be addressed.

## 3. Architecture Components

### Data Layer
*   **Retrofit**: Used for API communication (Backend).
*   **Preferences**: `androidx.datastore` for storing user preferences and cached credentials.

### UI Layer
*   **MainActivity**: Hosting activity.
*   **VpnEventsReceiver**: BroadcastReceiver for VPN state changes (Connected, Disconnected, Error).

## 4. Security
*   **Certificate Pinning**: Scripts like `fix-nigeria-server-cert.sh` suggest manual management of server certificates, which is a potential maintenance risk.
*   **Cleartext Traffic**: Allowed (`android:usesCleartextTraffic="true"`). *Recommendation*: Disable in production for security compliance.
