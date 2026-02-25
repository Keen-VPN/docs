# 6. Security Transport Protocol: WireGuard

Date: 2026-02-25

## Status

Accepted

## Context

Establishing a Virtual Private Network requires a secure, encrypted tunnel between the client applications (`vpn-app`, `website` extensions) and the Edge VPN nodes (`infra-node-daemon`). Historically, legacy protocols like OpenVPN and IPsec have dominated the space. However, these protocols are characterized by massive, complex C codebases that are difficult to audit, and they often suffer from poor performance, particularly regarding latency and battery consumption on mobile devices.

## Decision

We are adopting **WireGuard** fundamentally as our exclusive VPN transport protocol layer across all nodes and clients.

## Consequences

### Positive

* **Performance**: WireGuard operates directly in the kernel space (or via highly optimized user-space Rust/Go bindings) offering leading cryptographic speed and vastly lower latency overhead compared to OpenVPN.
* **Battery Life**: The roaming capabilities and leaner cryptography (Noise Protocol Framework, ChaCha20-Poly1305) reduce CPU overhead, significantly extending mobile device battery life.
* **Auditability**: The WireGuard codebase is minimal (~4k lines of code originally), making security auditing drastically simpler than its predecessors.
* **Simplicity**: Configuration revolves entirely around public/private key pairs and simple routing tables.

### Negative

* **Strict Dependencies**: Clients must properly support WireGuard natively or bundle user-space modules.
* **UDP Only**: WireGuard strictly operates over UDP. It can potentially be blocked by highly restrictive enterprise firewalls that only allow TCP/443, necessitating future TCP fallbacks if bypass is required.
