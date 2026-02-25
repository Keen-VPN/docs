# iOS & macOS Client Architecture

## 1. Overview
The Apple ecosystem clients (`vpn-ios-app`, `vpn-macos-app`) share a common codebase structure using Swift and SwiftUI. They leverage the `NetworkExtension` framework for VPN connectivity.

*   **Language**: Swift
*   **UI**: SwiftUI
*   **Framework**: NetworkExtension (`NEVPNManager`)

## 2. VPN Implementation

### `VPNManager` (Shared Logic)
A singleton class (`ObservableObject`) responsible for the entire VPN state machine.

*   **Protocol**: `NEVPNProtocolIKEv2` (Personal VPN).
    *   *Note*: Does not use a custom `NEPacketTunnelProvider`, relying instead on the OS-provided IKEv2 stack.
*   **Configuration**:
    *   `remoteIdentifier`: server address.
    *   `localIdentifier`: "keen".
    *   `useExtendedAuthentication`: true (EAP).
    *   `deadPeerDetectionRate`: Medium.
    *   **Split Tunneling**: Enabled (`includeAllNetworks = false`). Hotspot traffic bypasses VPN to avoid double-NAT issues.

### Network Resilience
`VPNManager` implements sophisticated connection monitoring:
*   **Latency Monitoring**: Pauses/reconnects if latency exceeds 2.0s for >10s.
*   **Simulator Support**: built-in mocks for simulator execution (simulates 2s connection delay).

## 3. Security & Entitlements

### Capabilities
*   `com.apple.developer.networking.vpn.api`: `allow-vpn`
*   `com.apple.developer.applesignin`: Default

### Authentication
*   **Strategy**: Checks `AuthManager` first, falls back to stored Session Token in `UserDefaults`.
*   **Keychain**: Password references for the VPN configuration (`config.passwordReference`) are stored securely in the Keychain. The `NEVPNManager` accesses them by reference, never by value in memory.

## 4. In-App Purchases (IAP)
*   **Entitlement Check**: `VPNManager` listens for `IAPEntitlementChanged`. Bypasses backend subscription check if a valid local Apple receipt is found.
*   **Linking**: Transaction IDs are sent to the backend to "claim" the purchase for cross-platform usage.
