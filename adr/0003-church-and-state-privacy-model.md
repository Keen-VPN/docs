# 3. Church and State Privacy Model

* Status: accepted
* Deciders: Engineering Team, Product Team
* Date: 2026-02-25

Technical Story: Enforce strict data isolation between billing/identity metadata and VPN connection metadata to guarantee user privacy.

## Context and Problem Statement

As a VPN provider, guaranteeing user privacy is the absolute priority. If our database were compromised, or if we were legally compelled to provide logs, the architecture must guarantee that it is impossible to correlate a specific user's identity (email, payment method) with their specific VPN traffic or connected IP address. We must design a system where the "Billing/Identity" layer knows absolutely nothing about the "VPN Configuration" layer.

## Decision Drivers

* **Privacy by Design:** It must be technically impossible to match an identity to a VPN node.
* **Auditability:** The separation must be clear and auditable by third-party security firms.
* **Security:** A breach in our backend database should yield disconnected data fragments.
* **Functional Requirements:** The system still needs to verify that a client connecting to a VPN has a valid, active subscription.

## Considered Options

* **The "Church and State" Token Model:** Completely separate Identity tables from VPN Configuration tables, linked only through asymmetric cryptography or blinded tokens.
* **Opaque User IDs:** Use anonymized user IDs across the database, relying on strict access control.
* **No-Log Volatile Memory Profiles:** Keep associations only in RAM on the VPN nodes and delete immediately upon disconnect.

## Decision Outcome

Chosen option: **The "Church and State" Token Model**. The backend architecture explicitly separates the `Account/Subscription` domain (which holds Firebase UID, Stripe Customer ID) from the `VPNConfig` domain (which holds WireGuard Public Keys, Assigned Internal IPs).

When a user authenticates, they are issued an opaque, short-lived `node_token`. The VPN Node Daemon only receives this `node_token` and the user's explicit WireGuard public key during registration. The node validates the token with the backend. The backend verifies the token corresponds to an active subscription, but the Node never learns the user's identity, and the Backend does not strongly associate the Public Key with the Identity in persistent storage.

### Positive Consequences

* Achieves a zero-knowledge trust standard for connection tracking.
* Severely limits the blast radius of any database exfiltration.
* The backend (`vpn-backend-service-v2`) only knows *that* an anonymous key is active, not *who* the key belongs to.

### Negative Consequences

* Increased architectural complexity for customer support (investigating connection issues requires the user to provide their anonymous public key, as we cannot look it up by email).
* Harder to implement per-device analytical tracking or targeted troubleshooting.
