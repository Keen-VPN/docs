# Crypto Module

The Crypto module is an isolated internal library providing standardized cryptographic primitives.

## Features

- **Key Formatting**: Parsing and validating WireGuard base64-encoded Curve25519 public keys.
- **Token Generation**: Secure `randomBytes` usage for generating opaque internal identifiers like the `node_token`.
- **Anonymization**: Implementation details for blurring IPs or creating reproducible hashes linking a specific user to an anonymous identifier without storing raw associations where necessary.
