# KeenVPN Architecture Map

> **Generated:** 2025-12-08
> **Status:** Draft Analysis

## 1. System Overview

KeenVPN consists of a cross-platform client ecosystem (iOS, Android, macOS), a marketing/web-app frontend, and a centralized Node.js backend.

### Component Dependency Graph

```mermaid
graph TD
    User((User))
    
    subgraph Clients
        iOS[iOS App\n(SwiftUI)]
        Android[Android App\n(Kotlin/XML)]
        macOS[macOS App\n(SwiftUI)]
    end
    
    subgraph Web
        Website[Website / Web App\n(React + Vite)]
    end
    
    subgraph Cloud
        API[Backend API\n(Node.js + Express)]
        DB[(PostgreSQL)]
        Auth[Firebase Auth]
        Pay[Stripe]
    end
    
    User --> Website
    User --> iOS
    User --> Android
    User --> macOS
    
    iOS --> API
    Android --> API
    macOS --> API
    Website --> API
    
    API --> DB
    API --> Auth
    API --> Pay
```

---

## 2. Component Analysis

### 📱 Android Client (`/vpn-android-app`)
*   **Type:** Native Android Application
*   **Language:** Kotlin (Target SDK 34, Min SDK 30)
*   **UI Framework:** XML Layouts + ViewBinding (Legacy View system, typically transitioning to Compose in modern apps).
*   **Architecture:** MVVM (suggested by `androidx.lifecycle.viewmodel`).
*   **VPN Protocol:** **IKEv2 / IPsec** (Divergence from standard WireGuard recommendation).
    *   Uses explicit `Ikev2VpnProfile` (Android 11+ native).
    *   Libraries: `BouncyCastle` (Cryptography), `Retrofit` (API).
*   **Key Scripts:** Certificate patching scripts (`fix-nigeria-server-cert.sh`) suggest manual certificate pinning or management updates involved.

### 🍎 iOS Client (`/vpn-ios-app`)
*   **Type:** Native iOS Application
*   **Language:** Swift
*   **UI Framework:** SwiftUI
*   **Architecture:** Centralized Manager Pattern (`VPNManager.swift` ~73KB).
*   **VPN Protocol:** Likely **IKEv2** (inferred from Android parity) or **NetworkExtension** custom tunnel.
    *   **Note:** `VPNManager.swift` size suggests heavy logic handling, possibly bridging or extensive state management.
*   **Features:**
    *   Google Sign-In integration.
    *   In-App Purchases (StoreKit).
    *   Mapbox Integration (`MapboxWebView.swift`).

### 🖥️ macOS Client (`/vpn-macos-app`)
*   **Type:** Native macOS Application
*   **Language:** Swift
*   **UI Framework:** SwiftUI
*   **Architecture:** Mirrors iOS app (likely shares `VPNManager` logic conceptually, if not physically linked yet).
*   **Key Files:** `VPNManager.swift` (150KB) - significantly larger than iOS version, suggesting it might contain additional desktop-specific tunneling logic or legacy code.

### 🕸️ Website & Web App (`/website`)
*   **Type:** Single Page Application (SPA)
*   **Framework:** Vite + React + TypeScript
*   **Styling:** Tailwind CSS + Shadcn/UI (`@radix-ui/*`).
*   **State Management:** `@tanstack/react-query`.
*   **Role:**
    *   Marketing Landing Page (`index.html`).
    *   User Dashboard (Subscription management, likely).
*   **Integration:** Firebase (Auth) + Stripe (Payments).

### ☁️ Backend Service (`/vpn-backend-service`)
*   **Type:** REST API
*   **Runtime:** Node.js (Module type)
*   **Language:** TypeScript
*   **Framework:** Express.js
*   **Database:** PostgreSQL (managed via **Prisma ORM**).
*   **Deployment:** Dockerized (`docker-compose.yml`), Netlify configuration present (suggests hybrid or edge functions).
*   **Key Responsibilities:**
    *   User Authentication (JWT, Firebase Admin).
    *   Subscription Management (Stripe Webhooks).
    *   VPN Configuration Delivery (`scripts/start-tunnel.sh` suggests it might control a local tunnel for dev/testing).

---

## 3. Critical Observations & Risks (VPN PRIME Audit)

1.  **Protocol Divergence:** Android is using **IKEv2**. If "VPN PRIME" context prefers WireGuard for performance/modernity, this is a legacy debt or specific design choice (e.g., enterprise firewall traversal).
2.  **Monolithic Managers:** The `VPNManager.swift` files in iOS/macOS are massive (150KB+). This usually violates "Structural Integrity" and makes testing the state machine difficult.
3.  **Certificate Management:** Presence of shell scripts to "fix certs" in Android implies a brittle public key infrastructure (PKI) distribution method.
4.  **Security/Privacy:** Backend uses `firebase-admin` and `stripe`. We must ensure User IDs (Payment) are decoupled from VPN Session IDs (Privacy) as per the "Zero-Knowledge Auditor" protocol.
