# Backend Service Catalog

> **Strategy**: Monorepo (NestJS Workspace).
> **Objective**: Modular B2C Architecture with strict Privacy-By-Design.

## 1. Directory Structure (Monorepo)

```text
/backend
├── apps/                  # Deployable Microservices (The "Services")
│   ├── auth-service/      # Identity & Payment (Trusted)
│   ├── config-service/    # Token Redemption & VPN Config (Anonymous)
│   ├── analytics-service/ # Usage Data & Telemetry (Anonymous)
│   └── job-worker/        # Async Tasks (Blocklists, Cleanup)
├── libs/                  # Shared Types & Logic
│   ├── common/            # DTOs, Guards, Decorators
│   ├── crypto/            # Blind Signatures, NaCl/Box
│   ├── database/          # TypeORM/Prisma Configs (Postgres/Redis)
│   └── wireguard/         # Node Selection & Netlink wrappers
├── package.json
└── nx.json
```

## 2. Core B2C Services ("Project Phoenix")

### A. `b2c-auth` (The Gatekeeper)

* **Role**: Knows *Who* the user is.
* **Responsibilities**:
  * Validates Firebase ID Tokens.
  * Syncs Subscription Status (Stripe/Apple).
  * **Blind Signing**: Issues `Signed(Blind(Token))` upon proof of valid subscription.
* **Data Access**: Read/Write access to `UserDB` (Postgres). NO access to VPN Configs.

### B. `b2c-config` (The Anonymizer)

* **Role**: Knows *That* a user is valid, but not *Who* they are.
* **Responsibilities**:
  * **Token Redemption**: Verifies cryptographic signature of the Blind Token.
  * **Double-Spend Check**: Ensures token hasn't been used recently.
  * **Node Allocation**: Assigns the user to the best available WireGuard node.
* **Data Access**: Read/Write to `TokenSpendDB` (Redis). NO access to `UserDB`.

### C. `b2c-analytics` ( The Observer)

* **Role**: Collects anonymous usage data for decision making.
* **Design Constraints**:
  * **No PII**: IP Addresses must be dropped at ingress (Load Balancer level).
  * **No IDs**: Reports must NOT contain UserIDs or DeviceIDs. Use ephemeral session UUIDs or purely aggregate buckets.
* **Metrics Collected**:
  * **Performance**: Latency, Throughput, Connection Failures (Heatmap).
  * **Value**: Total MB Blocked, Time Saved (Aggregated).
  * **Usage**: Session Duration, Data Transferred (e.g., "1GB-5GB bucket").
* **Data Path**: `Client` -> `b2c-analytics` -> `ClickHouse` (OLAP).

## 3. Infrastructure Services

### D. `node-daemon` (The Edge)

* **Role**: Runs on EVERY VPN Node (Exit Nodes).
* **Responsibilities**:
  * **Self-Healing**: Reports health/load to internal monitoring.
  * **WireGuard Mgmt**: Configures kernel interfaces via Netlink.
  * **Firewall**: Manages `nftables` / `iptables` for NAT and blocking.

### E. `job-worker` (Async)

* **Role**: Background maintenance.
* **Responsibilities**:
  * **Blocklist Compiler**: Downloads StevenBlack hosts, compiles to binary Bloom Filter, uploads to CDN.
  * **Node Reaper**: Terminates ephemeral nodes > 24h old.
