# B2C Backend Detailed Design (Node.js / NestJS)

> **Framework**: [NestJS](https://nestjs.com/) (TypeScript).
> **Architecture**: Monorepo (Nx or Nest Workspace).
> **Database**: PostgreSQL (User Data), Redis (Ephemera/Blind Tokens), ClickHouse (Analytics).

## 1. High-Level Architecture

We will use a **NestJS Monorepo** for shared logic and modular services.

```mermaid
graph TD
    Client[Mobile/Desktop App]
    
    subgraph "Trusted Zone (Auth Service)"
        Auth[apps/auth-service]
        DB_User[(PostgreSQL: UserDB)]
    end
    
    subgraph "Anonymous Zone (Config Service)"
        Config[apps/config-service]
        DB_Spend[(Redis: SpendDB)]
    end

    subgraph "Analytics Zone"
        Analytics[apps/analytics-service]
        DB_Stats[(ClickHouse)]
    end

    Client -- "1. ID Token + Blind(T)" --> Auth
    Auth -- "2. Signed(Blind(T))" --> Client
    Auth -- Read/Write --> DB_User
    
    Client -- "3. Unblind(T) + Signed(T)" --> Config
    Config -- Verify & Alloc --> Client
    Config -- Check Double Spend --> DB_Spend

    Client -- "4. Anon Metrics" --> Analytics
    Analytics -- Ingest --> DB_Stats
```

## 2. User Flows & Sequence Diagrams

### Flow A: Authentication & Token Issuance (The "Blind" Sign)

This flow ensures we sign a token permitting VPN usage WITHOUT knowing the token's value.

```mermaid
sequenceDiagram
    participant User as User Device
    participant Auth as Auth Service (NestJS)
    participant FB as Firebase Auth
    participant DB as UserDB (Postgres)
    participant Crypto as CryptoService (Lib)

    User->>FB: Login (Google/Apple)
    FB-->>User: ID Token (JWT)
    
    User->>User: T = Random(), Blinded = Blind(T, r)
    User->>Auth: POST /auth/login { idToken, blindedToken }
    
    Auth->>FB: Verify ID Token
    Auth->>DB: Get/Create User, Check Subscription
    
    alt Subscription Valid
        Auth->>Crypto: Sign(blindedToken, PrivateKey)
        Crypto-->>Auth: signature
        Auth-->>User: { signature, expiration }
    else Invalid
        Auth-->>User: 403 Forbidden
    end
    
    User->>User: Unblind(signature, r) -> Valid Signature for T
```

### Flow B: Token Redemption (Location Selection & Connection)

The user selects a location, then presents the unblinded token to get credentials for that specific region.

```mermaid
sequenceDiagram
    participant User as User Device
    participant Config as Config Service (NestJS)
    participant Redis as SpendDB (Redis)

    User->>Config: GET /vpn/locations
    Config-->>User: [{ id: "us-east", name: "USA (Virginia)", load: 45% }, ...]

    User->>User: Select Location (e.g., "us-east")

    User->>Config: POST /vpn/config { token, signature, locationId: "us-east" }
    
    Config->>Config: Verify Signature(token) using Issuer Public Key
    
    Config->>Redis: SETNX token "used" (TTL 24h)
    alt Token was already present?
        Redis-->>Config: 0 (False) -> Double Spend!
        Config-->>User: 409 Conflict
    else Valid
        Redis-->>Config: 1 (True)
        Config->>Config: Find available Node in "us-east"
        Config-->>User: { wireguardConfig: [Interface, Peer] }
    end
```

## 3. Database Design (ERD)

### UserDB (Postgres) - Connected to `auth-service`

Strictly stores Account & Payment data. NO Usage logs.

```mermaid
erDiagram
    USERS {
        uuid id PK
        string firebase_uid UK
        string email
        string stripe_customer_id
        timestamp subscription_expiry
        timestamp created_at
    }
    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        string status "active/past_due/canceled"
        string plan_type "monthly/yearly"
        timestamp current_period_end
    }
    USERS ||--o| SUBSCRIPTIONS : has
```

### SpendDB (Redis) - Connected to `config-service`

Stores used token hashes to prevent replay attacks.

* **Key**: `spent:<token_hash>`
* **Value**: `timestamp`
* **TTL**: 24-48 hours.

### AnalyticsDB (ClickHouse) - Connected to `analytics-service`

Stores anonymous events.

* **Table**: `session_metrics`
* **Columns**: `session_uuid` (random), `country_code`, `platform` (iOS/Android), `bytes_transferred`, `trackers_blocked`, `duration_seconds`.

## 4. Module & Folder Structure (NestJS Monorepo)

### Root Structure

```text
/backend
├── apps/
│   ├── auth-service/
│   ├── config-service/
│   └── analytics-service/
├── libs/
│   ├── common/           # Shared DTOs, Guards, Decorators
│   ├── crypto/           # Blind Signature Logic (RSA-FDH / Node Buffer)
│   ├── database/         # TypeORM/Prisma Configs
│   └── wireguard/        # Node Selection Algorithms
├── package.json
└── nx.json
```

### Module Breakdown

#### A. `apps/auth-service`

* **Description**: Handles Identity & Payments.
* **Modules**:
  * `AuthModule`: `AuthController` (login endpoints), `AuthService` (Firebase verification).
  * `PaymentModule`:
    * `StripeService`: Syncs `stripe_customer_id` and Webhooks.
    * `AppleStoreService`: Validates IAP Receipts via App Store Server API (`verifyReceipt`).
  * `TokenModule`: Uses `libs/crypto` to sign blinded tokens.
* **Key Files**:
  * `src/auth/auth.controller.ts`: Endpoint `block_blind_sign`.
  * `src/payment/stripe.webhook.ts`: Reacts to `invoice.payment_succeeded`.
  * `src/payment/apple.service.ts`: Validates `latest_receipt` from client.

#### B. `apps/config-service`

* **Description**: Unauthenticated (conceptually) service that trades Tokens for Configs.
* **Modules**:
  * `RedemptionModule`: `RedemptionController` (redeem), `DoubleSpendGuard` (Redis check).
  * `AllocationModule`: Selects best node *within the requested location*.
  * `LocationModule`: Public endpoint returning available regions/countries.
* **Key Files**:
  * `src/redemption/redemption.service.ts`: Verifies crypto signature.
  * `src/allocation/node-selector.ts`: Logic to pick random healthy node in `locationId`.

#### C. `libs/crypto`

* **Description**: Shared cryptographic primitives.
* **Tech**: Use `forge` or `crypto` module with `blind-signatures` implementation.
* **Key Files**:
* `src/blind-scheme.ts`: `sign(blindedMessage, privateKey)`, `verify(message, signature, publicKey)`.
* `src/keys.ts`: Key rotation management (loading current Epoch keys).

#### D. `libs/common`

* **Description**: Shared types to ensure Frontend/Backend alignment.
* **Files**:
  * `dtos/auth.dto.ts`: `LoginRequest { idToken: string, blindToken: string }`.
  * `dtos/vpn-config.dto.ts`: `VpnConfigResponse { privateKey: string, endpoint: string }`.

## 5. Technical Summary & Implementation Notes

1. **Blind Signatures in Node.js**:
    * We will use **RSA-FDH** (Full Domain Hash) or **Bolt** protocol.
    * *Implementation*: Use `node-rsa` or native `crypto` to perform the modular exponentiation required for RSA blinding if a library isn't available. Ensure keys are 2048-bit minimum.
2. **Concurrency**:
    * Node.js Event Loop is perfect for the I/O heavy `auth-service` (waiting on Firebase/Stripe) and `config-service` (waiting on Redis).
3. **Strict Separation**:
    * `auth-service` **MUST NOT** import `AllocatedNode` logic.
    * `config-service` **MUST NOT** import `User` entity or `UserDB` connection.
    * *Enforcement*: Use Nx `module-boundaries` lint rules to forbid `config-service` from importing `libs/database/user-entity`.
4. **Analytics**:
    * Use `Fire-and-Forget` pattern. Client sends UDP or HTTP POST; Service acknowledges immediately, pushes to internal Queue, then Batch Inserts to ClickHouse to handle high scale.
