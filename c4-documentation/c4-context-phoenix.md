# C4 Model: KeenVPN B2C ("Project Phoenix")

> **Scope**: Consumer VPN Service (Privacy & Anonymity Focus).
> **Notation**: C4 (Context, Containers, Components).

## Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram for KeenVPN B2C

    Person(consumer, "B2C User", "A privacy-conscious individual.")
    
    System(keenvpn, "KeenVPN System", "Provides anonymous, encrypted internet access.")

    System_Ext(firebase, "Firebase Auth", "Identity Provider (Google/Apple Logins).")
    System_Ext(stripe, "Payment Provider", "Stripe/Apple IAP. Processes payments.")
    
    System_Ext(blocklist_source, "Blocklist Provider", "StevenBlack/Others. Source of DNS blocklists.")
    System_Ext(internet, "The Internet", "The destination for user traffic.")

    Rel(consumer, keenvpn, "Connects to & Manages Subscription")
    Rel(keenvpn, firebase, "Authenticates via")
    Rel(keenvpn, stripe, "Verifies Receipts")
    Rel(keenvpn, blocklist_source, "Downloads Definitions")
    Rel(keenvpn, internet, "Routes Traffic Anonymously")
```
  
## Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram for KeenVPN B2C

    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="3")

    Person(consumer, "B2C User", "Owner of the device.")

    System_Ext(internet, "The Internet", "The destination for user traffic.")

    System_Boundary(c1, "User Device (Client Zone)") {
        Container(app, "Mobile/Desktop App", "Swift/Kotlin", "UI for login, settings, and subscription management.")
        Container(store, "Local Storage", "CoreData/Encrypted File", "Stores Config Profiles and Blind Tokens.")
        Container(tunnel, "Network Extension", "Swift/Rust", "Handles WireGuard tunnel, DNS Proxy, and AdBlock.")
    }

    System_Boundary(c2, "Control Plane (Cloud)") {
        Container(config, "Config Service", "NestJS", "Redeems tokens for ephemeral WireGuard credentials. Does NOT know User ID.")
        Container(auth, "Auth Service", "NestJS", "Handles User Identity, Payment History & Verification. Issues Blinded Tokens.")
        ContainerDb(node_db, "Node DB", "PostgreSQL", "Stores Node Configs, Regions & Metrics.")
        Container(cdn, "Static Asset CDN", "Cloudflare/AWS S3", "Hosts Blocklists and AdBlock binaries.")
    }

    System_Boundary(c3, "Data Plane (Ephemeral Grid)") {
        Container(wg_node, "WireGuard Node", "Alpine Linux", "Ephemeral VPN termination point. No logging. Route traffic.")
    }

    Rel(consumer, app, "Uses")
    
    Rel(app, auth, "1. Auth (Firebase), History & Blind Request", "HTTPS/JSON")
    Rel(auth, app, "2. Returns Signed Blind Token / History", "HTTPS/JSON")
    Rel(app, config, "3. Get Locations, Redeem Token & Connect", "HTTPS/JSON + Token")
    Rel(config, node_db, "Reads Nodes/metrics", "SQL")
    
    Rel(app, tunnel, "Configures & Controls", "IPC/NEProvider")
    Rel(app, store, "Reads/Writes Tokens")

    Rel(tunnel, wg_node, "4. Encrypted Traffic", "WireGuard (UDP)")
    Rel(tunnel, cdn, "Updates Blocklists", "HTTPS")
    
    Rel(wg_node, internet, "5. Egress Traffic", "TCP/UDP")
    Rel(wg_node, config, "6. Register/Heartbeat", "HTTPS/JSON")
```

## Level 3: Component Diagram (Client Side)

```mermaid
C4Component
    title Component Diagram for Client Network Extension

    Container_Boundary(ne, "Network Extension") {
        Component(lifecycle, "Lifecycle Manager", "Swift", "Handles NEPacketTunnelProvider events, Sleep/Wake, Network Change.")
        Component(wg_wrapper, "WireGuard Adapter", "Rust/Swift", "Wraps `boringtun` or `WireGuardKit`. Manages handshake.")
        Component(dns_proxy, "DNS Proxy / Content Filter", "eBPF/Swift", "Intercepts DNS queries. Checks against Blocklist.")
        Component(kill_switch, "Kill Switch Logic", "Swift", "Drops packets if Tunnel Status != Ready.")
    }
    
    Container_Boundary(storage, "Shared App Group") {
        ComponentDb(block_db, "Bloom Filter Source", "Binary File", "Memory-mapped AdBlock database.")
        ComponentDb(token_store, "Token Store", "Keychain", "Stores blinded tokens.")
    }

    Rel(lifecycle, wg_wrapper, "Starts/Stops")
    Rel(dns_proxy, block_db, "Reads (Memory Map)")
    
    System_Ext(internet, "The Internet", "Destination")
    Rel(wg_wrapper, internet, "Sends Encrypted Packets")
```

## Level 3: Component Diagram (Backend - Auth & Config)

```mermaid
C4Component
    title Component Diagram for Backend Services (Split Knowledge)

    Container_Boundary(auth_svc, "Auth Service") {
        Component(sub_checker, "Subscription Manager", "NestJS", "Talks to Stripe/Apple. Trial Logic.")
        Component(acct_mgr, "Account Manager", "NestJS", "Fetches Payment History.")
        Component(signer, "Blind Token Signer", "NestJS", "Signs requests using RSA Blind Signatures. Does not see input.")
    }

    Container_Boundary(config_svc, "Config Service") {
        Component(redeemer, "Token Redeemer", "NestJS", "Verifies signature. Checks against Double-Spend DB.")
        Component(allocator, "Node Allocator", "NestJS", "Selects best Node in requested Location.")
        Component(ingest, "Metric Ingest", "NestJS", "Process Heartbeats. ZADDs scores to Redis.")
        Component(loc_mgr, "Location Manager", "NestJS", "Lists available Regions.")
        ComponentDb(state_db, "State DB", "Redis", "Stores spent tokens & O(1) Load Scores.")
        ComponentDb(node_db, "Node DB", "PostgreSQL", "Stores Node Configs & Metrics.")
    }

    Rel(sub_checker, signer, "Authorizes Signing")
    Rel(redeemer, state_db, "Checks (Replay)")
    Rel(redeemer, allocator, "Request Node")
    Rel(allocator, node_db, "Read Configs/Metrics")
    Rel(allocator, state_db, "Read Scores (O(1))")
    Rel(loc_mgr, node_db, "Reads Regions")
    Rel(ingest, state_db, "Writes Scores")
    Rel(ingest, node_db, "Updates Status")
```
