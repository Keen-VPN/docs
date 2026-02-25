# B2C Backend Detailed Design (Node.js / NestJS)

> **Framework**: [NestJS](https://nestjs.com/) (TypeScript).
> **Architecture**: Majestic Monolith.
> **Database**: PostgreSQL (User Data, Analytics) via Prisma ORM, Redis (Ephemera/Blind Tokens).

## 1. High-Level Architecture

We use a **NestJS Monolith** for backend functions. The internal modules maintain strict boundary segregation to mimic microservices (Church and State Privacy).

```mermaid
graph TD
    Client[Mobile/Desktop App]
    
    subgraph External
        FB[Firebase Auth]
        Stripe[Stripe / Apple]
    end

    subgraph "vpn-backend-service-v2 (Monolith)"
        Gatekeeper[Identity & Billing Modules]
        Anonymizer[VPN Config & State Modules]
        DB_User[(PostgreSQL: User/Node DB)]
        DB_Spend[(Redis: Blind Token DB)]
    end

    %% Identity & Payment Flows
    Client -. "0. Auth/Refresh" .-> FB
    Client -- "1. Account Mgmt (ID Token)" --> Gatekeeper
    Gatekeeper -. "Sync" .-> Stripe
    Gatekeeper -- Read/Write --> DB_User

    %% VPN Token Flow
    Client -- "2. Blind(T) + ID Token" --> Gatekeeper
    Gatekeeper -- "3. Signed(Blind(T))" --> Client
    
    %% VPN Connection Flow (Anonymous)
    Client -- "4. Unblind(T) + Signed(T)" --> Anonymizer
    Anonymizer -- Verify & Alloc --> Client
    Anonymizer -- Check Double Spend --> DB_Spend
    Anonymizer -- Read/Write Nodes --> DB_User

    %% Infrastructure
    Node[VPN Node] -- "7. Register/Pulse" --> Anonymizer
```

## 2. End-to-End System Flows

### 1. VPN Connection: Happy Path (Active Sub or Trial)

* **Goal**: The complete journey from a valid user to an active VPN connection.
* **Pre-requisite**: User requested a Blind Token via `POST /auth/vpn-token` using a valid JWT.

```mermaid
sequenceDiagram
    participant User
    participant Config as vpn-config module
    participant Redis as Redis (Double Spend)

    User->>Config: POST /vpn/config { token, signature, location: "de-frankfurt" }
    
    Config->>Config: Verify RSA Signature (Is this our stamp?)
    Note right of Config: Fails if signature invalid.
    
    Config->>Redis: SETNX spent:<hash(token)> (TTL 24h)
    
    alt Token is Fresh (Returns 1)
        Redis-->>Config: OK
        Config->>Config: Allocate Node
        Config-->>User: 200 OK { wireguard_conf: ... }
    else Double Spend (Returns 0)
        Redis-->>Config: Exists
        Config-->>User: 409 Conflict (Token Reuse Detected)
    end
```

## 3. Folder Structure (`src/`)

```text
/vpn-backend-service-v2/src/
├── account/          # User profile and history management
├── auth/             # Firebase identity verification & session
├── connection/       # VPN session state tracking
├── crypto/           # Blind Signature & cryptographic utilities
├── logger/           # Centralized logging
├── nodes/            # Edge VPN node registration and fleet state
├── notifications/    # Email/Push alerts
├── payment/          # Stripe webhooks & processing
├── preferences/      # User app configuration
├── prisma/           # Database ORM client and schema
├── subscription/     # Plan provisioning and access control
└── vpn-config/       # Anonymous token redemption & WireGuard key exchange
```

## 4. Prisma Database Schema

We use Prisma for our PostgreSQL schema. We strictly separate Identity tables from Network tables via application logic.

### User & Identity Entities

- `User`: Core identity, references Firebase UID.
* `Subscription`: Billing states corresponding to a User.
* `PaymentHistory`: Transaction logs.
* `UserPreferences`: Configuration parameters per user.

### Network & Infrastructure Entities

- `Location`: Available geographical VPN routing regions.
* `Node`: Edge VPN Daemon definitions and active runtime state.
* `Connection`: Active session history. It deliberately lacks a `user_id` relation to preserve zero-logs privacy.

## 5. Token Generation (The Blind Sign)

1. **Token Request**:
    * *Goal*: Obtain valid anonymous signature.
    * *Prerequisite*: Valid Firebase ID Token + Active Subscription.

```mermaid
sequenceDiagram
    participant User
    participant Auth as auth module
    participant DB as Prisma User DB
    participant Crypto as crypto module

    User->>User: Generate Random Token (T)
    User->>User: Blind(T) -> BlindedToken
    
    User->>Auth: POST /auth/vpn-token { blindedToken }
    Auth->>DB: Check Subscription (Must be Active)
    
    alt Active / Trial
        Auth->>Crypto: Sign(BlindedToken)
        Crypto-->>Auth: Signature
        Auth-->>User: 200 OK { signature, expiry: "24h" }
    else Inactive
        Auth-->>User: 403 Forbidden
    end

    User->>User: Unblind(Signature) -> Valid Signature for T
```

## 6. Config Service & Node Flows

1. **Node Registration (Startup)**:
    * *Goal*: A new ephemeral node registers itself with the Monolith API.

```mermaid
sequenceDiagram
    participant Node
    participant Nodes as node module
    participant DB as Prisma Node DB

    Node->>Nodes: POST /node/register { public_key, ip, location_id }
    Nodes->>DB: Upsert Node (Status: healthy)
    
    Nodes-->>Node: 201 Created { id: "<node_id>" }
```

1. **Node Pulse (Health)**:
    * *Goal*: Report liveliness and load.

```mermaid
sequenceDiagram
    participant Node
    participant Nodes as node module
    participant DB as Prisma Node DB

    Node->>Nodes: POST /node/{id}/pulse { currentLoad: 45 }
    Nodes->>DB: Update Node Load Score
    Nodes-->>Node: 200 OK
```
