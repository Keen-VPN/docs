# Android Implementation Roadmap

## 1. Core Architecture

* **VpnService**: The standard Android API for traffic interception.
* **Shared Core**:
  * **Language**: Rust (compiled to `.so` via JNI).
  * **Libraries**: `boringtun` (Cloudflare) or `wireguard-go` via GoMobile.
  * **Recommendation**: Use **Rust** (`uniffi`) for crypto and config parsing to share logic with iOS (if functionality moves to Rust) or just keep parallel implementations for Phase 1.
  * *Decision:* For Phase 1 (Speed), use the official `wireguard-android` library (Kotlin + Go). Phase 2: Migrate to Shared Rust Core.

## 2. UI/UX

* **Framework**: Jetpack Compose (Modern, Declarative).
* **Navigation**: Jetpack Navigation.
* **State Management**: Kotlin Flow / Coroutines.

## 3. Specific Challenges

* **Doze Mode**: Android kills background services aggressively.
  * *Mitigation*: Foreground Service Notification is mandatory. `WorkManager` for keep-alives.
* **Split Tunneling**:
  * Use `builder.addAllowedApplication(packageName)` for simple "Allow List".
  * Use `builder.addDisallowedApplication(packageName)` for "Exclude List".
* **Always-On VPN**:
  * Support the System "Always-On" toggle (requires correct Service configuration).
