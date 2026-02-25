# 2. Serverless Deployments with NestJS

* Status: accepted
* Deciders: Engineering Team
* Date: 2026-02-25

Technical Story: Architect the V2 Backend for zero-maintenance auto-scaling HTTP environments.

## Context and Problem Statement

The KeenVPN backend needs to handle highly variable traffic spikes based on user connection requests and subscription verifications. Maintaining a constantly running fleet of virtual machines via EC2 or ECS requires manual scaling policies, base load costs, and higher operational overhead. We need a backend architecture that scales instantly from zero to thousands of requests and charges strictly per execution.

## Decision Drivers

* **Operational Overhead:** Minimizing devops burden for the startup team.
* **Cost Efficiency:** Only paying for compute when users actively hit the API.
* **Scaling:** Must scale horizontally instantly to handle "thundering herd" problems when regions disconnect and reconnect.
* **Ecosystem Compatibility:** Needs to support TypeScript and complex domain-driven logic.

## Considered Options

* **Serverless Functions (AWS Lambda / Netlify Functions / Vercel):** Event-driven, auto-scaling compute.
* **Container Orchastration (Kubernetes / EKS):** Highly flexible, isolated, continuously running containers.
* **Platform as a Service (Heroku / Render):** Continuously running web dynos with rule-based auto-scaling.

## Decision Outcome

Chosen option: **Serverless Functions running NestJS**, because we can use `@vendia/serverless-express` to wrap the entire NestJS application into a single Lambda function handler. This enables us to maintain a majestic monolith with strict Domain-Driven Design using NestJS's dependency injection, while deploying entirely as a serverless function to platforms like Netlify or AWS API Gateway, achieving zero-maintenance infinite scaling.

### Positive Consequences

* Complete reduction of idle compute costs.
* No need to manage load balancers, container registries, or scaling groups.
* Developer experience remains excellent; the application can be run locally on a persistent Node.js instance (via `npm run start:dev`) effortlessly.

### Negative Consequences

* Higher "Cold Start" latency for the first request after periods of inactivity.
* Stateless execution requires careful dependency management (e.g., maintaining database connection pools outside the execution context so they persist across warm executions).
* Vendor limitations on execution execution time (e.g. 10-30 seconds max), precluding the use of long-running websockets natively in the primary API.
