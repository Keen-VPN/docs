# Client Scaffolding & File Structure

> **Purpose**: Blueprint for the iOS & macOS Monorepo.
> **Targets**: iOS App, macOS App, Network Extensions, Shared Core.
> **Language**: Swift 6 using Swift Package Manager (SPM) for local modules.

## 1. Directory Tree Overview

```text
/vpn-ios-app (Root for Monorepo)
├── KeenVPN.xcworkspace
├── Packages/
│   └── KeenVPNCore/               # Local Shared SPM Package
│       ├── Sources/
│       │   ├── CoreAuth/
│       │   ├── CoreVPN/
│       │   ├── CoreNetworking/
│       │   └── CoreData/
│       └── Package.swift
├── Apps/
│   ├── KeenVPN_iOS/
│   │   ├── Application/
│   │   ├── UI/
│   │   └── Resources/
│   └── KeenVPN_macOS/
│       ├── Application/
│       └── UI/
└── Extensions/
    ├── PacketTunnel/
    └── ContentFilter/
```

## 2. Shared Logic (`Packages/KeenVPNCore`)

This package contains 90% of the business logic to ensure identical behavior across platforms.

### `Sources/CoreAuth`

* **`AuthService.swift`**: Facade for User Identity. Manages `AuthState` (LoggedIn/Out).
* **`FirebaseProvider.swift`**: Wraps `FirebaseAuth`. Handles `signInWithGoogle` and `signInWithApple`.
* **`BlindSigner.swift`**: Verification logic.
  * `blind(message)`: Generates `r` and blinds the token.
  * `unblind(signature)`: Unblinds the server response.
* **`KeychainManager.swift`**: Secure storage for `FirebaseUID` and `BlindTokens`.

### `Sources/CoreVPN`

* **`VPNManager.swift`**: The "God Object" for tunnel control.
  * Wraps `NETunnelProviderManager`.
  * Exposes `connect()`, `disconnect()`, `pause()`.
* **`VPNStateMachine.swift`**: (Actor) maintainer of state. Prevents race conditions during rapid Connect/Disconnect toggles.
* **`TunnelConfigGenerator.swift`**: Converts backend JSON response into `[Interface]` and `[Peer]` WireGuard settings.

### `Sources/CoreNetworking`

* **`APIClient.swift`**: Generic `async/await` HTTP client.
* **`Endpoints.swift`**: Enum defining `/auth/login`, `/vpn/locations`, `/vpn/config`.
* **`NetworkMonitor.swift`**: Uses `NWPathMonitor` to detect WiFi/Cellular changes (triggers Auto-Connect logic).

### `Sources/CoreData`

* **`Model.xcdatamodeld`**: Schema for `UsageSession` and `Preference`.
* **`Persistence.swift`**: CoreData stack initialization.
* **`AppGroup.swift`**: Static helpers for accessing the Shared Container (`group.com.keenvpn`). used for `tunnel_status.json`.

## 3. iOS App (`Apps/KeenVPN_iOS`)

### `Application/`

* **`KeenApp.swift`**: Entry point (`@main`). Initializes `AppCoordinator`.
* **`AppCoordinator.swift`**: Root navigator. Checks `CoreAuth.isLoggedIn` to decide `rootViewController`.

### `UI/Onboarding/`

* **`LoginViewModel.swift`**: Binds to `CoreAuth`. Handles loading states/errors.
* **`SubscriptionViewModel.swift`**: Fetches Products from StoreKit 2.
* **`PermissionViewModel.swift`**: Requests `NEVPNManager.saveToPreferences()` (System Popup).

### `UI/Dashboard/`

* **`HomeViewModel.swift`**:
  * Observes `CoreVPN.VPNStatus`.
  * Calculates "Time Saved" from local CoreData stats.
* **`LocationSelectViewModel.swift`**: Fetches list from `APIClient`. Filters locally.
* **`MapView.swift`**: SwiftUI Map showing current location vs VPN location.

## 4. Network Extensions (`Extensions/`)

### `PacketTunnel/` (The WireGuard Process)

* **`PacketTunnelProvider.swift`**: Subclass of `NEPacketTunnelProvider`.
  * `startTunnel()`: Bootstraps WireGuard-Go (via adapter).
  * `stopTunnel()`: Teardown.
* **`WireGuardAdapter.swift`**: Swift-to-C bridge for the WireGuard implementation (BoringTun or Go).
* **`DNSProxy.swift`**: Intercepts UDP/53. Forwards to internal resolver *inside* the tunnel.

### `ContentFilter/` (The AdBlocker)

* **`FilterDataProvider.swift`**: Subclass of `NEFilterDataProvider`.
* **`BloomFilter.swift`**: Memory-mapped reader for the binary blocklist file.
* **`FlowHandler.swift`**:
  * `handleNewFlow()`: Extracts Hostname.
  * Checks BloomFilter.
  * Returns `.drop` or `.allow`.
  * Writes increment to `SharedAppGroup/metrics` file (Atomic).
