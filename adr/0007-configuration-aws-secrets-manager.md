# 7. Configuration Management: AWS Secrets Manager

Date: 2026-02-25

## Status

Accepted

## Context

Configuration variables containing sensitive key material—such as the Firebase Admin private keys (`FIREBASE_PRIVATE_KEY`), the cryptographic blind signing material (`BLINDED_SIGNING_PRIVATE_KEY`), and authentication node tokens (`NODE_TOKEN`)—must be distributed accurately to both the serverless `vpn-backend-service-v2` and the auto-scaling fleet of `infra-node-daemon` instances. Using standard `.env` files burned into images or injected manually poses a severe security risk if the instances are compromised, and causes desynchronization when keys must be rotated seamlessly across a live fleet.

## Decision

We will integrate directly with **AWS Secrets Manager** to serve as the single source of truth for runtime secrets. Both the backend and the node Daemons will fetch their necessary credentials natively at startup via AWS IAM execution roles.

## Consequences

### Positive

* **Zero Hardcoded Secrets**: No secret material exists in GitHub, CI/CD environmental logs, or static `.env` files on disk.
* **Seamless Rotation**: Secrets can be rotated instantly in AWS, and nodes/backends can fetch the new parameters upon reboot/reconnect.
* **IAM Boundaries**: EC2 instances and Lambda functions access the secrets using zero-trust IAM roles, eliminating the need to pass AWS access keys around to fetch the secrets.

### Negative

* **Startup Dependency**: The application boot sequence is entirely mapped to the availability and latency of the AWS Secrets Manager API. If the region API fails, nodes cannot boot.
* **Cost**: AWS Secrets Manager incurs a minor fixed monthly cost per secret and API request, unlike static file injection.
