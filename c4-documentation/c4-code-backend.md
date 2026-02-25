# C4 Architecture - Level 4: Code

This document outlines the bottom-up code structure of the two primary system execution clusters.

## 1. Backend Service V2 (`vpn-backend-service-v2`)

The backend is built as a single NestJS Monolith.

### Backend Directory Mapping

* `src/account`: Manages the user profile logic, exposing `AccountController`.
* `src/auth`: Intercepts and validates Firebase JWTs (`FirebaseAuthGuard`).
* `src/common`: Houses utility logic shared globally (e.g. decorators, pagination intercepts).
* `src/connection`: Core connection logging and latency mapping.
* `src/crypto`: Executes RSA/EdDSA cryptographic permutations and blind signing.
* `src/logger`: Abstracts console output to external monitoring parameters.
* `src/nodes`: Executes fleet health-checks and edge registration payloads.
* `src/notifications`: Wraps MailGun/SendGrid abstractions.
* `src/payment`: Captures Stripe webhooks and generates checkout sessions.
* `src/preferences`: Controls desktop/mobile interface configurations.
* `src/prisma`: Interacts directly with Neon Serverless Postgres via the generated ORM client.
* `src/subscription`: Maps logical plans (`Free`, `Plus`) to capability arrays.
* `src/vpn-config`: Orchestrates Key Exchange mapping returning exact WireGuard configurations to anonymous requests.

## 2. Node Daemon (`infra-node-daemon`)

The node daemon acts as the edge executor.

### Daemon Directory Mapping

* `cmd/daemon`: The primary Golang entry point setting up the HTTP listeners.
* `internal/wireguard`: Executes actual `wg` system calls natively mutating kernel network boundaries.
* `internal/server`: Holds the router logic capturing the blinded token verification.
* `internal/api`: Defines the external request schemas used back and forth with the monolith.
* `internal/config`: Loads OS environmental files mapping out expected static ports and paths.
