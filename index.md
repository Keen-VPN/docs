---
layout: home

hero:
  name: "KeenVPN Engineering"
  text: "Security Without Compromise"
  tagline: "The living documentation for Project Phoenix (B2C), Project Aegis (B2B), and Current Operations."
  image:
    src: /logo.png
    alt: KeenVPN
  actions:
    - theme: brand
      text: 🚀 Project Phoenix (B2C)
      link: /new/architecture/C4_B2C_PHOENIX
    - theme: alt
      text: 🛡️ Project Aegis (B2B)
      link: /new/architecture/C4_B2B_AEGIS
    - theme: alt
      text: 🔍 Security Audits
      link: /current/AUTH_AUDIT_REPORT

features:
  - title: Zero-Knowledge Architecture
    details: System design based on Blind Tokens (RSA-FDH) and ephemeral infrastructure. We verify, we don't log.
  - title: Military-Grade Compliance
    details: Enterprise stack (Aegis) with deep audit capabilities, IAM integration, and Device Posture checks.
  - title: High-Velocity Engineering
    details: WireGuard-native performance (10Gbps+), Rust/Go backend, and Kotlin/Swift native clients.
---

# 📚 Documentation Atlas

## 🔮 Future State (Roadmaps & RFCs)

### Architecture & Backend

* [**Phoenix (B2C) System Context**](/new/architecture/C4_B2C_PHOENIX.md) - *The new consumer VPN standard.*
* [**Aegis (B2B) System Context**](/new/architecture/C4_B2B_AEGIS.md) - *Enterprise security layer.*
* [Backend Service Catalog](/new/architecture/BACKEND_SERVICE_CATALOG.md)
* [Infrastructure Detailed Design](/new/architecture/INFRASTRUCTURE_DETAILED_DESIGN.md)

### Client Engineering

* [**Universal Client Architecture**](/new/clients/CLIENT_ARCHITECTURE.md)
* [iOS/macOS Detailed Design](/new/clients/CLIENT_DETAILED_DESIGN.md)
* [Android Roadmap & Refactor](/new/clients/ANDROID_ROADMAP.md)

### Security & Privacy

* [**Threat Model (v1.0)**](/new/security/THREAT-MODEL-001.md)
* [AdBlock & Privacy Spec](/new/features/ADBLOCK_PRIVACY_SPEC.md)

---

## 🏛️ Current State (Reference & Audits)

### Security Audits

* [🚨 **Authentication Audit Report**](/current/AUTH_AUDIT_REPORT.md)
* [Subscription Security Analysis](/current/VPN_SUBSCRIPTION_SECURITY.md)

### Legacy Architecture

* [**System Overview**](/current/detailed_architecture/SYSTEM_OVERVIEW.md)
* [Architecture Map](/current/ARCHITECTURE_MAP.md)
* [Backend Services](/current/detailed_architecture/BACKEND.md)
* [Android Implementation](/current/detailed_architecture/ANDROID.md)
* [iOS/macOS Implementation](/current/detailed_architecture/IOS_MACOS.md)
