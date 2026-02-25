# 1. Use Firebase Authentication

* Status: accepted
* Deciders: Engineering Team
* Date: 2026-02-25

Technical Story: Implement a scalable, cross-platform authentication layer for KeenVPN.

## Context and Problem Statement

We needed a robust, cross-platform authentication solution that supports email/password, social logins, and anonymous authentication flows without requiring us to manage the security and maintenance burden of storing user credentials and managing password resets directly on our servers. The solution must support both the client apps (iOS, Android, macOS, Windows) and the Node.js backend (`vpn-backend-service-v2`) securely.

## Decision Drivers

* **Time to Market:** Must be easy and fast to integrate.
* **Security:** Must strictly handle identity according to industry standards.
* **Cross-Platform Support:** High-quality SDKs are required for both mobile apps (Flutter/Native) and backend (Node.js).
* **Cost:** Should be cost-effective for a growing user base.
* **Extensibility:** Must allow storing custom claims to pass application-specific state across services.

## Considered Options

* **Firebase Authentication:** Managed authentication service by Google.
* **Auth0:** Comprehensive identity platform for B2B and B2C.
* **Supabase Auth:** Open-source Firebase alternative based on PostgreSQL.
* **In-House Authentication (JWT/Passport.js):** Custom implementation managing accounts directly in the PostgreSQL database.

## Decision Outcome

Chosen option: **Firebase Authentication**, because it provides the most mature, battle-tested cross-platform SDKs for mobile environments and integrates perfectly with our NestJS backend using Firebase Admin. It offloads password management completely and offers a generous free tier for MAUs.

### Positive Consequences

* No need to store sensitive passwords or manage password recovery flows.
* Easy integration of social logins (Google, Apple, etc.) in the future without changing the backend architecture.
* Custom claims allow us to attach internal user UUIDs to the JWT token seamlessly, enabling stateless authorization in NestJS.

### Negative Consequences

* Vendor lock-in to Google Cloud infrastructure for the core identity component.
* Slightly increased latency compared to an in-house solution during the initial token verification handshake.
* Reliance on third-party SDK sizes on the client apps.
