# Backend Service Catalog

> **Strategy**: Majestic Monolith (NestJS Workspace).
> **Objective**: Consolidated architecture with strict Privacy-By-Design and modular domain separation.
> **Repository**: `vpn-backend-service-v2`

## 1. Directory Structure

The backend operates as a single deployable NestJS application, structured using Domain-Driven Design (DDD) principles.

```text
/vpn-backend-service-v2
├── src/
│   ├── account/          # User profile and history management
│   ├── auth/             # Firebase identity verification & session
│   ├── connection/       # VPN session state tracking
│   ├── crypto/           # Blind Signature & cryptographic utilities
│   ├── logger/           # Centralized logging
│   ├── nodes/            # Edge VPN node registration and fleet state
│   ├── notifications/    # Email/Push alerts
│   ├── payment/          # Stripe webhooks & processing
│   ├── preferences/      # User app configuration
│   ├── prisma/           # Database ORM client and schema
│   ├── subscription/     # Plan provisioning and access control
│   └── vpn-config/       # Anonymous token redemption & WireGuard key exchange
├── package.json
└── tsconfig.json
```

## 2. Core Domains ("Project Phoenix")

The backend consolidates what were historically distinct microservices logically into modular domains.

### A. Identity & Billing (The Gatekeeper)

* **Modules**: `auth`, `account`, `subscription`, `payment`
* **Role**: Knows *Who* the user is.
* **Responsibilities**:
  * Validates Firebase ID Tokens.
  * Syncs Subscription Status.
  * **Account Mgmt**: Manages Payment History & User Profiles.
  * **Privacy Shield**: Issues `Signed(Blind(Token))` cryptographically without linking the token to the user ID.
* **Data Access**: Has Read/Write access to user-identifying tables (`User`, `Subscription`). NO access to VPN connection state logs.

### B. VPN Configuration (The Anonymizer)

* **Modules**: `vpn-config`, `crypto`, `nodes`, `connection`
* **Role**: Knows *That* a user is valid, but not *Who* they are.
* **Responsibilities**:
  * **Location Discovery**: Publicly lists available VPN regions/endpoints.
  * **Fleet Management**: Registers new Edge VPN nodes and ingested node metrics.
  * **Token Redemption**: Verifies cryptographic signature of the Blind Token.
  * **Config Gen**: Returns WireGuard keys (`Peer/Interface`) and routes users to optimal nodes.
* **Data Access**: Write/Read `Node` and connection metrics. **NO Access** to `User` identification tables to preserve zero logs.

## 3. Future Enhancements

While the current system utilizes a single cohesive API, the following components are scheduled for future implementation:

### C. Analytics Service (The Observer)

* **Role**: Will collect anonymous usage data (latency, aggregated usage buckets) for decision-making without tracking PII or IP addresses.
* **Status**: *Planned for future integration*.

### D. Async Job Worker

* **Role**: Will handle background maintenance operations such as compiling blocklists, cleaning up stale sessions, and reaping dead nodes asynchronously.
* **Status**: *Planned for future integration*.
