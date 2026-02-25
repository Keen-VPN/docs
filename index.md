---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "VPN Platform docs"
  text: "For the new architecture"
  tagline: B2C/B2B
  actions:
    - theme: brand
      text: Internal Portal
      link: /product-overview
    - theme: alt
      text: Developer Setup Guide
      link: /README
    - theme: alt
      text: Legacy V1 Documentation
      link: /legacy-v1/index

features:
  - title: 1. Core Platform
    details: Covers Node orchestration, backend services, load balancing, wireguard, vmess, trojan-go deployments.
  - title: 2. Core Security API
    details: Covers the B2C App integration and the B2B administrative SaaS frontend.
  - title: 3. Telemetry/Analytics
    details: Real-time analytics and system vitals utilizing the ELK Stack, Prometheus, and Grafana.
---

## Comprehensive Domain Map

This repository has been structured by domain for ease of navigation. Below is the master map to all documentation resources, establishing a clear path from product requirements to low-level backend integration.

### High-Level Context

- [**Product Overview**](./product-overview.md): The functional requirements and business context connecting all features.
- [**C4 Context: Aegis (B2B)**](./c4-documentation/c4-context-aegis.md): The enterprise administrative context map.
- [**C4 Context: Phoenix (B2C)**](./c4-documentation/c4-context-phoenix.md): The consumer VPN application context map.
- [**C4 Component Architecture**](./c4-documentation/c4-component.md): Core platform components.
- [**C4 Container Architecture**](./c4-documentation/c4-container.md): Deployment boundary outlines.

---

### Core Architecture & Infrastructure

- [**Backend Service Catalog**](./architecture/backend-service-catalog.md): Complete list of V2 backend services.
- [**B2C Backend Design**](./architecture/b2c-backend-design.md): In-depth review of consumer backend functionality.
- [**B2B Architecture RFC**](./architecture/b2b-architecture-rfc.md): Request for comments on enterprise SaaS design.
- [**Infrastructure Design**](./architecture/infrastructure-design.md): Initial infrastructure outline.
- [**Infrastructure Detailed Design**](./architecture/infrastructure-detailed-design.md): Elaborated infrastructure topologies.
- [**Infrastructure Scaffolding**](./architecture/infrastructure-scaffolding.md): Infrastructure-as-Code directory map.
- [**Security & Threat Model**](./architecture/threat-model-001.md): General analysis of threats and implemented safeguards.
- [**Software Architecture Guidelines**](./architecture/software-architecture-guidelines.md): General architectural principles.

---

### Client Applications

- [**Client Architecture**](./clients/client-architecture.md): The unified strategy across all frontend implementations.
- [**Client Detailed Design**](./clients/client-detailed-design.md): Deep dive into client application internals.
- [**Client Scaffolding**](./clients/client-scaffolding.md): Folder layout for client codebases.
- [**Android Roadmap**](./clients/android-roadmap.md): Specific roadmap and technical details for the Android app.

---

### Backend Service Modules

Detailed investigations into the business logic behind specific microservice or monolithic modules.

- [Account Module](./backend/account.md)
- [Auth Module](./backend/auth.md)
- [Connection Management](./backend/connection.md)
- [Crypto/Security Policies](./backend/crypto.md)
- [Node Management](./backend/nodes.md)
- [Notification Services](./backend/notifications.md)
- [Payment Gateways](./backend/payment.md)
- [Preferences & Sales Tracking](./backend/preferences-and-sales.md)
- [Prisma ORM Configurations](./backend/prisma.md)
- [Subscription Lifecycle](./backend/subscription.md)
- [VPN Configurations](./backend/vpn-config.md)

---

### Feature Specifications

- [**AdBlock & Privacy Spec**](./features/adblock-privacy-spec.md): Requirements and technical implementation details for the ad-blocking feature set.

---

### Architecture Decision Records (ADRs)

- [**ADR Index**](./adr/README.md): Log of major architectural pivots.
- [**0001: Firebase Auth**](./adr/0001-use-firebase-authentication.md)
- [**0002: NestJS Serverless**](./adr/0002-serverless-deployments-with-nestjs.md)
- [**0003: Church & State Privacy**](./adr/0003-church-and-state-privacy-model.md)

---

### Legacy (V1) Documentation

*Historical references for components transitioning to V2.*

- [**V1 Index**](./legacy-v1/index.md)
- [V1 Architecture Map](./legacy-v1/architecture-map.md)
- [V1 Auth Audit Report](./legacy-v1/auth-audit-report.md)
- [V1 VPN Subscription Security](./legacy-v1/vpn-subscription-security.md)
- **Detailed V1 Architecture**:
  - [Android](./legacy-v1/detailed-architecture/android.md)
  - [Backend](./legacy-v1/detailed-architecture/backend.md)
  - [iOS / macOS](./legacy-v1/detailed-architecture/ios-macos.md)
  - [System Overview](./legacy-v1/detailed-architecture/system-overview.md)
