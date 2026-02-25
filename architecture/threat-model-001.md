# THREAT-MODEL-001: KeenVPN "Project Phoenix"

> **Status:** ACTIVE
> **Focus:** Comprehensive System Security Architecture (V2)

## 1. System Overview & Trust Boundaries

The KeenVPN system is composed of several isolated components working in concert.

### Trust Boundaries

1. **Client Apps (iOS/macOS/Windows/Android)**: *Untrusted Environment*. The user's device holds their private identity (Firebase Auth) and generates the cryptographic Blind Tokens to be signed. We assume the environment could be compromised.
2. **Backend API (Monolith on Netlify)**: *Trusted Core*. The single source of truth for Identity and Billing. Trusted to know *who* paid, but architecturally isolated from knowing *what* they do.
3. **AWS Infrastructure (Terraform/EC2/Secrets Manager)**: *Trusted Foundation*. Holds all environmental secrets (`NODE_TOKEN`, `FIREBASE_PRIVATE_KEY`, `BLINDED_SIGNING_PRIVATE_KEY`). Management is strictly declarative via GitOps (`infra-terraform`).
4. **Edge Configuration (Ansible)**: *Trusted Automation*. `infra-ansible` bootstraps new EC2 instances securely, fetching secrets dynamically to eliminate hardcoded credentials.
5. **VPN Nodes (Edge OS & Node Daemon)**: *Untrusted Data Plane*. Must not know *who* is connected, only that they hold a valid unblinded cryptographic token. Stores zero logs.
6. **Public Internet**: *Hostile*. The final exit point.

### Data Flow & Sensitivity

| Data Type | Location | Sensitivity | Mitigation |
| :--- | :--- | :--- | :--- |
| **Identity / Firebase UID** | Backend (Prisma DB) | High | Minimal collection. Offloaded password hashing to Firebase. |
| **Payment Information** | Stripe | High | Fully off-loaded to Stripe PCI-compliant servers. |
| **Real Client IP** | Edge Node (RAM) | Critical | Ephemeral only. Dropped immediately after WireGuard handshake. Never synced. |
| **Browsing Data / Traffic** | Edge Node | Critical | Never logged. Passed through NAT exclusively in RAM. |
| **Infrastructure Secrets** | AWS Secrets Manager | Critical | Fetched at runtime via IAM/RBAC. Never committed. |

## 2. STRIDE Analysis (End-to-End)

### S - Spoofing

* **Threat:** Attacker impersonates a valid user to bypass payment.
* **Mitigation:** Backend issues Cryptographically Signed Blind Tokens only to active Firebase subscribers. VPN Config Service verifies the RSA signature of unblinded tokens.
* **Threat:** Malicious Wi-Fi intercepts VPN handshake.
* **Mitigation:** WireGuard utilizes strict pre-shared keys and public key pinning (Noise Protocol Framework).
* **Threat:** Rogue Node Daemon spoofing legitimacy.
* **Mitigation:** Node Daemons authenticate via the centralized `NODE_TOKEN` injected via AWS Secrets Manager.

### T - Tampering

* **Threat:** ISP or Man-in-the-Middle modifies traffic.
* **Mitigation:** HTTPS (TLS 1.3) encapsulates all control plane APIs. WireGuard (Poly1305) protects tunnel integrity.
* **Threat:** Unauthorized modification of infrastructure.
* **Mitigation:** All AWS/Node configuration is immutable. Modifications require PR approval targeting the `infra-terraform` or `infra-ansible` repositories.

### R - Repudiation

* **Context:** For B2C Privacy, we **feature** Repudiation. We *want* to be unable to prove a user did X.
* **Mitigation:** Shared IP addresses (NAT Masquerading) on exit nodes. No connection logs correlating User IDs with Node IPs.

### I - Information Disclosure

* **Threat:** "The Correlation Attack" (Linking payment time to connection time).
* **Mitigation:** **Blind Signatures** (Privacy Pass architecture). Token issuance is decoupled from token redemption. Backend signs a blinded hash it cannot read.
* **Threat:** Server compromise reading historical traffic.
* **Mitigation:** Node Daemons run on Alpine Linux in RAM (`tmpfs`). Zero-logging policy enforced at the OS level (`nftables`).

### D - Denial of Service

* **Threat:** DDoS against the monolithic Backend API.
* **Mitigation:** Netlify Edge Network scaling and WAF rate limiting.
* **Threat:** UDP Flood against WireGuard nodes.
* **Mitigation:** WireGuard's native "Cookie" mechanism (stateless defense). Node Daemons auto-scale via AWS Auto Scaling Groups reacting to load spikes.

### E - Elevation of Privilege

* **Threat:** Attacker gains SSH access to a VPN Node.
* **Mitigation:** SSH is disabled entirely (Password Auth off). Only SSM is permitted.
* **Threat:** Backend API vulnerabilities.
* **Mitigation:** Strict NestJS Guards and Roles matrices decoupling the `auth` identity modules from the `vpn-config` modules.

## 3. Specific Attack Scenarios & Defenses

### Scenario A: Subpoena for "User X"

* **Attack:** Legal demand for logs regarding `user@example.com`.
* **Defense:** Backend can provide the account creation date and Stripe payment history. We attest that we mathematically cannot correlate the identity to an assigned IP address or traffic block due to the Blind Signature decoupling protocol.

### Scenario B: Target Node Compromise

* **Attack:** Adversary exploits a zero-day to gain root on a running VPN node.
* **Defense:**
  * The node holds no PII. It only tracks connected WireGuard public keys and anonymous session metrics.
  * *Residual Risk:* Active traffic can be captured *while* the node is compromised. Nodes are treated as ephemeral and regularly reap/replaced by Terraform and Auto-Scaling logic to minimize the compromise window.

### Scenario C: Rogue Insider

* **Attack:** Engineer attempts to extract system secrets to spawn rogue nodes.
* **Defense:** Secrets (e.g., `NODE_TOKEN`, Stripe secrets) are locked behind AWS Secrets Manager. IAM access controls prevent blanket secret extraction.
