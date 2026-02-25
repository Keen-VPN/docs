# Software Architecture Guidelines

This document outlines the engineering principles and architectural constraints governing the KeenVPN platform.

## 1. Domain-Driven Design (DDD)

The backend (`vpn-backend-service-v2`) is rigidly segregated into specific business domains. Modules like `VPNConfig` or `Subscription` must not directly inject or manipulate another module's database primitives if it undermines the separation of concerns. Cross-module communication is done via highly defined Service exports.

## 2. Serverless-First Scaling

The backend API is designed as a stateless application wrapped by `@vendia/serverless-express`.

- **No in-memory session state**: Websockets or persistent long-polling that rely on instance affinity are prohibited. Stateful actions must be pushed to the database or an external cache like Redis.
- **Cold start awareness**: Database connection pooling uses external solutions (or specialized Prisma tuning) to prevent connection storms when thousands of Lambda containers spin up instantly.

## 3. The "Church and State" Model

We enforce strict data isolation between billing/identity metadata and VPN connection metadata to guarantee user privacy. It must always be technically impossible to match a specific user identifier (UUID, Email) to a live VPN endpoint or WireGuard public key through a single database query.

## 4. Frontend Componentization

The `website` and `vpn-app` utilize strict component rendering. For the website, Vue.js and VitePress provide SSG/SSR optimization for high SEO performance. For the apps, standard BLoC/Provider state architecture prevents spaghetti state updates across screens.

## 5. Security Posture

- **Zero-Trust Networking**: Edge nodes must authenticate via signed, expiring `node_token` values. They never have direct database access.
- **Firebase Auth**: All user identities are handled externally. We do not store, hash, or manage user passwords on KeenVPN servers under any circumstances.
