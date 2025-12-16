# Client Architecture: iOS & macOS

## 1. Code Sharing Strategy

* **Monorepo**: Both apps live in the same repo (or separate roots as configured).
* **Shared Logic**: `KeenVPNCore` (Swift Package).
  * **Modules**:
    * `KeenAuth`: Handles Blind Token exchange and Keychain access.
    * `KeenWireGuard`: Safe wrapper around `WireGuardKit` (tunnel management).
    * `KeenConfig`: Manages VPN Profiles and Token Redemption.
    * `KeenLocation`: Fetches available server locations (`GET /vpn/locations`) and stores user preference.
    * `KeenTelemetry`: Privacy-preserving analytics buffer.

## 2. Extension Architecture (The "Deep Kernel" Constraints)

* **Network Extension (Packet Tunnel)**:
  * **Memory Limit**: Strict 15MB on iOS.
  * **Language**: Swift.
  * **Responsibility**:
    * Packet Encapsulation/Decapsulation (WireGuard).
    * DNS Proxy (draining packets to local resolver).
    * Kill Switch enforcement (dropping packets if tunnel isn't Ready).
* **Content Filter (NEFilterDataProvider)**:
  * **Purpose**: AdBlock and Tracker blocking.
  * **Mechanism**:
    * `handleNewFlow`: Check Hostname/IP against memory-mapped Bloom Filter.
    * **Performance**: Must return decision in <5ms.

## 3. Inter-Process Communication (IPC)

The App and the Extension are separate processes.

* **Configuration**:
  * `NETunnelProviderManager.loadFromPreferences()`
  * `providerBundleIdentifier`: Critical link.
* **Live State (VPN Status)**:
  * **Mechanism**: `App Group` Shared Container (`group.com.keenvpn`).
  * **File**: `tunnel_status.json` (Atomic writes).
* **Configuration**:
  * `NETunnelProviderManager.loadFromPreferences()`
  * `providerBundleIdentifier`: Critical link.
* **Live State (VPN Status)**:
  * **Mechanism**: `App Group` Shared Container (`group.com.keenvpn`).
  * **File**: `tunnel_status.json` (Atomic writes).
  * **Notifications**: `CFNotificationCenter` (Darwin Notifications) to trigger UI updates.
* **XPC (macOS only)**:
  * Used for Helper Tool (if we need privileged operations like installing helper tools, though avoiding this is preferred for App Store sandbox).

## 4. Feature Implementation Details

### A. Connect on Demand (Always-On Default)

* **Philosophy**: "Background Security". The VPN should be active 24/7 unless explicitly paused.
* **Logic**:
  * **Default**: `Connect` on `AnyWiFi` and `Cellular`.
  * **Trusted Networks** (Configurable): `Disconnect` on specific SSIDs.
  * **User Override**: A "Pause" button (1h, 8h, 24h) temporarily disables the On-Demand rules.
* **Implementation**: `NEOnDemandRuleConnect` is the base rule.

### B. The "Smart" Kill Switch

* **Level 1 (OS)**: `includeAllNetworks = true`. The OS routing table prioritizes the tunnel.
* **Level 2 (Client)**: If tunnel handshake fails, the Tunnel Provider keeps the interface UP but drops all outgoing packets (Fail-Closed).

### C. Split Tunneling

* **macOS**: `NEAppRule` - Route specific App Bundle IDs outside tunnel.
* **iOS**: `IPv4Settings.excludedRoutes` - Route specific connection IPs (e.g., LAN) outside.

### D. Value Analytics (Local)

* **Purpose**: Show the user the value they get (gamification).
* **Metrics Tracked (Locally)**:
  * **Usage Duration**: `Session Start` - `Session End`. Accumulated daily.
  * **Data Usage**: Bytes In/Out.
  * **Value Saved**:
    * **Trackers Blocked**: Count of blocks from Content Filter.
    * **MB Saved**: Estimate based on average ad size (e.g., 50KB/ad).
    * **Time Saved**: Estimate based on average page load delay per tracker (e.g., 0.1s/tracker).
* **Privacy**: These stats are calculated **on-device** and stored in `UserDefaults`/`CoreData`. They are **NOT** sent to the backend unless user opts-in to anonymous "Community Stats".
