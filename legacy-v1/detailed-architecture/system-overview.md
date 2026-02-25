# System Overview - KeenVPN

> **Version:** 1.0.0
> **Last Updated:** 2025-12-08

## 1. High-Level Architecture

KeenVPN follows a client-server architecture centered around a "Zero-Knowledge" privacy model for B2C users. The system consists of native clients for mobile/desktop, a marketing/dashboard web application, and a centralized REST API that manages authentication and subscription state without logging browsing activity.

### C4 Container Diagram

```mermaid
graph TD
    User((User))

    subgraph Clients
        iOS[iOS Client\n(Swift/SwiftUI)\nNetworkExtension]
        Android[Android Client\n(Kotlin)\nVpnService/IKEv2]
        macOS[macOS Client\n(Swift/SwiftUI)\nNetworkExtension]
    end

    subgraph Web
        Website[Web Dashboard\n(React + Vite)]
    end

    subgraph Cloud["Backend Infrastructure (Docker)"]
        API[API Service\n(Node.js/Express)]
        DB[(PostgreSQL\nPrisma ORM)]
        Redis[Redis\n(Caching/Queue)]
    end

    subgraph External
        Firebase[Firebase Auth]
        Stripe[Stripe Payments]
        AppleIAP[Apple App Store]
        VPN_Nodes[VPN Exit Nodes\n(StrongSwan/WireGuard)]
    end

    User --> iOS
    User --> Android
    User --> macOS
    User --> Website

    iOS -- HTTPS/JSON --> API
    Android -- HTTPS/JSON --> API
    macOS -- HTTPS/JSON --> API
    Website -- HTTPS/JSON --> API

    iOS -- IKEv2/IPsec --> VPN_Nodes
    Android -- IKEv2/IPsec --> VPN_Nodes
    macOS -- IKEv2/IPsec --> VPN_Nodes

    API --> DB
    API --> Firebase
    API --> Stripe
    API -- Verify Receipt --> AppleIAP
```

## 2. Security Principles

### A. Zero-Knowledge Architecture
*   **Separation of Concerns**: User identity (Payment/Auth) is strictly decoupled from VPN Usage (Connection Logs).
*   **Ephemeral Logs**: The `connection_sessions` table in the database is designed to aggregate data for analytics but does NOT store traffic content or destination IPs.
*   **Blind Tokens**: (Planned) Future architecture will implement blind signatures to prove subscription status to VPN nodes without revealing user identity.

### B. Authentication & Authorization
*   **Identity Provider**: Firebase Auth is the primary source of truth for user identity.
*   **Session Management**:
    *   **Mobile/Desktop**: Permanent session tokens generated after Firebase login.
    *   **Web**: Short-lived JWTs.
*   **IAP Integration**: Apple In-App Purchases are linked to user accounts via `originalTransactionId`. The backend maintains a ledger of purchases (`AppleIAPPurchase`) to allow cross-platform entitlement sharing.

## 3. Data Flow

### Connection Flow
1.  **Auth**: Client authenticates with API via Firebase Token.
2.  **Config**: Client requests list of available servers (`/api/config` or cached).
3.  **Credential**: Client requests short-lived VPN credentials/secrets.
4.  **Connect**: Client establishes IKEv2 tunnel directly to the VPN Node (bypassing API).
5.  **Report**: Client reports session stats (duration, bytes) to API for quota tracking (if applicable).

### Payment Flow (Stripe)
1.  **Checkout**: User initiates purchase on Website.
2.  **Webhook**: Stripe calls `/api/subscription/webhook`.
3.  **Provision**: Backend creates `Subscription` record and updates User entitlement.
4.  **Sync**: Client polls/receives notification of status change.
