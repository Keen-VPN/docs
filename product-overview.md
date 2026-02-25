# KeenVPN: Product Overview & Strategy

> **Target Audience:** Product Owners, Stakeholders, Engineering Leads
> **Purpose:** To provide a comprehensive view of the KeenVPN product from a business, product, functional, and non-functional perspective.

## 🌍 Mission & Vision

**Mission:** To provide secure, uncompromised, mathematically anonymous internet access, returning digital sovereignty to the end user.  
**Vision:** Redefine the VPN landscape by proving that high-speed, reliable connectivity does not require logging or sacrificing user privacy, fundamentally separating identity from traffic entirely.

---

## 🏢 Business Perspective

KeenVPN aims to establish a sustainable, recurring revenue model built on structural trust and verified privacy.

* **Monetization**: Subscription-driven recurring revenue (SaaS). Purchases are routed via Stripe (Web) and Apple In-App Purchases (iOS/macOS).
* **Value Proposition**: Demonstrable local metrics—such as trackers blocked and bandwidth saved—proving the app's ongoing value to retain subscriptions. By gamifying these tracking analytics natively, we drive higher monthly retention.
* **Risk Profile**: Minimizing regulatory and security liabilities by storing *zero* PII relative to traffic logs (using cryptographic blind-signatures) and ensuring zero PCI scope by offloading payment processing completely to Stripe.

---

## 📦 Product Perspective: B2C vs B2B

We are building a unified VPN infrastructure that serves two distinct markets with fundamentally different product goals: **Phoenix (B2C)** and **Aegis (B2B)**.

### The Current Focus: B2C (Project Phoenix) 🚀

* **Status**: **Primary & Current Active Focus**
* **Target Market**: Individual privacy-conscious consumers seeking seamless digital protection.
* **Platforms**: iOS and macOS (built on a SwiftUI unified core).
* **Core User Experience**: "Background Security". The VPN remains always-on, silently blocking ads/trackers and encrypting traffic without user intervention.
* **Privacy Model**: Zero-knowledge "Church and State" architecture ensuring ultimate anonymity.

### The Roadmap: Android & B2B (Project Aegis) 🛣️

* **Status**: **Later Plan / Future Roadmap**
* **Android Development**: Transitioning the legacy Android application architecture to modern standards matching the optimal iOS experience.
* **B2B Target Market (Aegis)**: Modern enterprises and SMBs seeking Zero Trust Network Access (ZTNA) and Secure Web Gateways.
* **B2B Critical Distinctions**:
  * B2C prioritizes *absolute anonymity*; B2B prioritizes *absolute accountability*.
  * B2B introduces Identity Provider (IdP) integration (Okta, Azure AD, SAML).
  * B2B utilizes Verifiable Audit Logs (encrypted with the company's public keys).
  * B2B enables Private gateways to access VPCs/On-Premises networks safely.
  * B2B enforces Device Posturing (ensuring MDM compliance, OS versions before connection).

---

## ⚙️ Functional Requirements (FRs)

*These define what the system MUST DO.*

### B2C (Current Emphasis)

1. **Authentication**: Users must be able to authenticate securely via Firebase (Email/Social) and Apple Sign-In.
2. **Payments & Entitlements**: Users must be able to purchase, upgrade, and cancel subscriptions natively or via the web portal. The backend must react instantly to webhook status changes.
3. **Tunnel Connection**: Users must be able to connect to the optimal VPN exit node based on lowest-latency load balancing scoring algorithms dynamically fetched from the API.
4. **Ad & Tracker Blocking**: The client must dynamically filter malicious domains and telemetry trackers via local mechanisms (`NEFilterDataProvider` on Apple platforms).
5. **Smart Kill Switch**: The application must halt all external non-VPN outbound traffic if the tunnel drops (fail-closed routing) to prevent IP leaks.
6. **Telemetry Reporting**: Clients must report billing telemetry (session duration, bytes transferred) without exposing the associated target IPs.

### B2B / Android (Future Expansion)

1. **SSO Integration**: Corporate employees must authenticate using centralized IdP SAML/OIDC.
2. **Policy Enforcement**: Administrators must be able to define and enforce granular access policies restricting specific teams to specific internal resources.
3. **Auditing**: The system must generate immutable logs of connection attempts for enterprise compliance reporting.
4. **Android Modernization**: The Android app must migrate away from older IKEv2 setups to native WireGuard tunnel encapsulations.

---

## 🏗️ Non-Functional Requirements (NFRs)

*These constrain how the system MUST BEHAVE (Quality Attributes).*

1. **Security & Privacy (Highest Priority)**
    * **Zero-Knowledge Logging**: It must be mathematically impossible for KeenVPN operators to correlate a specific user's identity to their egress web traffic.
    * **Cryptography Standard**: Employs industry-standard WireGuard (ChaCha20-Poly1305, Curve25519) for network transport, and RSA Blind Signatures for un-linkable token authorization.
    * **Platform Security**: Client secrets and configurations must be bound to OS-native secure enclaves (Apple Keychain, Android Keystore).
2. **Performance & Latency**
    * **Throughput**: Network exit nodes must support 10Gbps+ routing speeds.
    * **Tunnel Initialization**: Connection establishment via WireGuard must complete in under 500ms under standard network conditions.
3. **Scalability & Reliability**
    * **Ephemeral Architecture**: VPN nodes must be stateless, auto-configured, and horizontally scalable via automated Terraform/Ansible pipelines.
    * **Backend Overhead**: API operations handle burst traffic securely via a serverless Lambda approach on Netlify.
    * **Availability**: Target a 99.99% uptime for the central API control plane.
4. **Usability**
    * **Frictionless Experience**: Cross-platform clients must prioritize absolute simplicity—"One click to secure". The intensive underlying complexity of the Blind Token validation exchange must remain completely invisible to the end user.
