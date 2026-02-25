# THREAT-MODEL-001: KeenVPN "Project Phoenix"

> **Status:** DRAFT
> **Focus:** B2C Privacy & Zero-Knowledge Architecture

## 1. System Overview & Trust Boundaries

### Trust Boundaries

1. **Device Boundary**: The User's Device (iOS/macOS). Trusted to hold the private identity.
2. **Auth Boundary**: The Authentication Service. Trusted to know *who* paid, but untrusted for *what* they do.
3. **Network Boundary**: The WireGuard Nodes. Untrusted. Must not know *who* is connected, only that they are authorized.
4. **Internet Boundary**: The Exit. Completely untrusted.

### Data Flow & Sensitivity

| Data Type | Location | Sensitivity | Mitigation |
| :--- | :--- | :--- | :--- |
| **Email/Password** | Auth Service | High | Salted Hashing (Argon2), never logged. |
| **Payment ID** | Auth Service | High | Stored in dedicated PCI-compliant DB. decoupled from VPN usage. |
| **Real IP** | Ingress (WG Node) | Critical | Ephemeral only. Dropped immediately after handshake. |
| **Browsing Data** | Egress (WG Node) | Critical | Never logged. RAM only. |
| **VPN Credentials** | Config Service | High | One-time use or short-lived. |

## 2. STRIDE Analysis

### S - Spoofing

* **Threat:** Attacker impersonates a valid user to use the VPN for free.
* **Mitigation:** `Auth Service` issues Cryptographically Signed Blind Tokens. `Config Service` verifies signature.
* **Threat:** Malicious Wi-Fi acts as the VPN server.
* **Mitigation:** WireGuard utilizes pre-shared keys and public key pinning. Client verifies Server public key.

### T - Tampering

* **Threat:** ISP modifies configuration packets.
* **Mitigation:** All API communication over HTTPS (TLS 1.3). WireGuard protocol protects the tunnel integrity (Poly1305).
* **Threat:** Malicious app on device modifies blocklists.
* **Mitigation:** App Sandbox + App-Group storage (read-only for Extension). System Integrity Protection (macOS) / Sandbox (iOS).

### R - Repudiation

* **Threat:** User denies performing malicious activity (e.g., hacking).
* **Context:** For B2C, we **feature** Repudiation. We *want* to be unable to prove a user did X.
* **Mitigation:** Shared IP addresses (NAT) on exit nodes. No connection logs.

### I - Information Disclosure

* **Threat:** "The Correlation Attack" - Identifying a user by correlating Payment Time with Connection Time.
* **Mitigation:** **Blind Tokens** (Privacy Pass). The token issuance is decoupled from token redemption. User buys 30 "Day Tokens" at once.
  * *Scenario:* Police demand "User who connected at 12:00".
  * *Result:* We have no logs of connection times linked to User IDs. We only know a valid token was redeemed.

### D - Denial of Service

* **Threat:** DDoS against Auth Service.
* **Mitigation:** Cloudflare WAF. Rate limiting on API execution.
* **Threat:** UDP Flood against WireGuard ports.
* **Mitigation:** WireGuard "Cookie" mechanism (stateless defense).

### E - Elevation of Privilege

* **Threat:** Attacker gains root on VPN Node.
* **Mitigation:**
  * Nodes run Alpine Linux (minimal).
  * WireGuard runs in kernel space (attack surface limited to WG module).
  * SSH disabled (use SSM or Bastion).
  * **Auto-Destruct:** Nodes are terminated and replaced every 24 hours.

## 3. Specific Attack Scenarios & Defenses

### Scenario A: Subpoena for "User X"

* **Attack:** Government demands all logs for `user@example.com`.
* **Defense:** We provide the Payment History. We attest that we have no logs of assigned IP addresses or traffic Usage for this user. Our architecture prevents us from knowing which Token belongs to User X after issuance.

### Scenario B: Rogue Employee

* **Attack:** Engineer `tcpdump`s the WireGuard interface on a live node.
* **Defense:**
  * Strict Access Control (IAM).
  * Nodes are ephemeral.
  * Root access requires multi-party approval (future goal).
  * *Residual Risk:* A live active attack on a specific node can capture traffic *at that moment*. No architecture can fully prevent this (traffic must exist in RAM to be routed), but ephemeral nodes minimize the window.

### Scenario C: Malicious IAP Receipt

* **Attack:** User replays a fake Apple Receipt.
* **Defense:** Server-side verification with Apple (App Store Server API).

## 4. Privacy Architecture Specifics

### Blind Token Issuance (OPRF)

1. **Blinding:** $$T_{blind} = H(Token) \times r$$ (Client side)
2. **Signing:** $$S_{blind} = T_{blind} \times K_{private}$$ (Server side)
3. **Unblinding:** $$S = S_{blind} \times r^{-1}$$ (Client side)
4. **Verification:** Verify $$S$$ corresponds to $$H(Token)$$ using $$K_{public}$$.

* *Result:* Server signs the token without knowing the underlying value.

### Ephemeral Identity

* WireGuard Public Keys are generated **on-demand** by the Client and rotated.
* Users do not have a static IP.
