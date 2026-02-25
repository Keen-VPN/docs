# Prisma Module

The fundamental data-access layer for the entire NestJS architecture.

## Implementation Details

`PrismaService` extends `PrismaClient` and is registered as a globally available module.
By instantiating it once as a singleton, we manage optimal Postgres connection pooling. In serverless deployment scenarios, Prisma is carefully configured to use Data Proxy or PGBouncer equivalent pooling methodologies to prevent connection exhaustion during cold-start bursts.
