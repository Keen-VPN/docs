# B2B Architecture RFC: KeenVPN Enterprise ("Project Aegis")

> **Mission**: Provide a secure, verifiable, and manageable connectivity layer for modern enterprises.
> **Philosophy**: "Verify Then Connect". Zero Trust Network Access (ZTNA) principles built on WireGuard.

## 1. High-Level Components

### Control Plane (The "Admin Dashboard")

* **Tenant Management**: Multi-tenant SaaS dashboard for Companies.
* **IAM Integration**: OIDC/SAML support (Okta, Azure AD, Google Workspace) for user syncing and SSO.
* **Policy Engine**: Defines who can talk to what.
* **Audit Logger**: Immutable, append-only verification log of every connection attempt.

### Data Plane (The "Gateways")

Nodes that handle the traffic. Unlike B2C "Exit Nodes", these are dedicated or semi-dedicated.

1. **Internet Gateway (Secure Web Gateway)**:
    * *Role*: Protects users accessing the public web.
    * *Features*: Anti-Phishing, Malicious Domain Blocking, DLP (Data Loss Prevention) Lite.
2. **Private Gateway (Remote Access)**:
    * *Role*: Allows users to access resources behind a firewall (virtual replacement for legacy VPNs).
    * *Deployment*: Docker/VM image running in customer's VPC/On-Prem.
3. **Mesh Gateway (Server-to-Server)**:
    * *Role*: Connects microservices across clouds.

## 2. Authentication & Identity

* **Company Account**: Represents the root entity.
* **User Identity**: Sourced from Identity Provider (IdP).
* **Device Identity**: Device Posture Check (OS Version, Disk Encryption, Jailbreak Status) before connection.
  * *Constraint*: Users cannot disable the VPN if "Always-On" policy is enforced by MDM.

## 3. Connector Types & Flows

### Scenario A: Working from Coffee Shop (User -> Internet)

* **Flow**: User Device -> Aegis Internet Gateway -> Public Web.
* **Policy**: Block Social Media, Allow SaaS.
* **Protection**: DNS Filtering + SNI Inspection (for domain blocking).

### Scenario B: Accessing Internal Admin Tool (User -> Private)

* **Flow**: User Device -> Aegis Control Plane (Auth) -> Encrypted Tunnel -> Customer Private Gateway -> Internal App.
* **Security**: Validates User + Device Posture.

### Scenario C: Backend Database Sync (Resource -> Resource)

* **Flow**: AWS Server (Mesh Agent) -> Azure Server (Mesh Agent).
* **Security**: Mutual TLS (mTLS) or WireGuard Static Keys managed by Control Plane.

## 4. Security & Compliance (Non-Negotiable)

### Cryptography

* **Data in Motion**: WireGuard (ChaCha20-Poly1305, Curve25519).
* **Data at Rest**: AES-256-GCM / XChaCha20.
* **Key Management**: Per-session keys. No shared secrets.

### Audit Logging

* **What**: Who (User ID), Device ID, Destination (IP/Domain), Time, Duration.
* **Encryption**: Logs are encrypted with the **Company's Public Key** immediately upon generation. KeenVPN admins cannot read these logs.
* **Destination**: Exportable to Splunk/Datadog/S3.

### Anti-Phishing & Defense

* **Real-time scanning**: Check DNS queries against Google Safe Browsing and proprietary Threat Intel feeds.
* **Phishing Prevention**: Heuristic analysis of look-alike domains (e.g., `g00gle.com`).

## 5. Admin Capabilities

* **Kill Switch override**: Admin can force "Fail-Closed" for all staff devices.
* **Traffic Inspection**: (Optional/Advanced) SSL Decryption (requires installing Root CA on devices). *Phase 2 Feature*.
* **Disable Prevention**: Admin policy dictates if "Disconnect" button is visible or active.
