# Auth Module

The Auth module acts as the entry point for all secured API requests. It relies entirely on Firebase Authentication for user identity management and Custom API Keys for internal node authentication.

## Architecture

- **`FirebaseAuthStrategy`**: A Passport strategy that intercepts incoming HTTP requests, extracts the Bearer token, and uses the `firebase-admin` library to verify the JWT signature.
- **`NodeAuthGuard`**: A custom NestJS guard that secures endpoints accessed exclusively by VPN Nodes, validating a securely generated `node_token`.

## Security

This module guarantees that no internal business logic is executed unless the client possesses a cryptographically verified token. We do not handle passwords or local JWT generation, massively reducing our threat surface.
