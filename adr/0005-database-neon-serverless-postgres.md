# 5. Database Choice: Neon Serverless Postgres

Date: 2026-02-25

## Status

Accepted

## Context

The backend service (`vpn-backend-service-v2`) requires a relational database to store user accounts, subscriptions, node metrics, and connection history. Traditional provisioned databases (like RDS instances) present two issues: they incur fixed costs even during low traffic periods, and they suffer from slow scale-out times during high-load connection events. Furthermore, modern localized testing and continuous integration benefit greatly from database branching (the ability to instantly clone a database schema and data for a PR environment).

## Decision

We will adopt **Neon Serverless Postgres** as the primary data store, interacting with it via the Prisma ORM.

## Consequences

### Positive

* **Scale-to-Zero**: Reduces cloud spend significantly during off-peak hours.
* **Instant Branching**: Developer velocity is increased as each developer/branch can instantiate a full clone of the database in seconds using Copy-on-Write techniques.
* **Managed Connection Pooling**: Allows serverless edge functions to establish massive volumes of connections without exhausting maximum connection limits on the database itself (PgBouncer integrated).

### Negative

* **Vendor Lock-in**: Relying heavily on Neon-specific branching and scaling paradigms makes migrating back to vanilla self-hosted Postgres more arduous in CI/CD.
* **Cold Starts**: If the database scales completely to zero, the first incoming request may experience noticeable latency while the compute cluster spins back up.
