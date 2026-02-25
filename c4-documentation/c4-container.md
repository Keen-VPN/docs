# C4 Container Architecture

The Container diagram shows the high-level shape of the **KeenVPN** software architecture and how responsibilities are distributed across it. It also shows the major technology choices and how the containers communicate with one another.

```mermaid
C4Context
    title Container diagram for KeenVPN System

    Person(customer, "Customer", "A user with an active subscription to the VPN service.")

    System_Boundary(keenvpn_boundary, "KeenVPN") {
        Container(website, "Marketing Website", "VitePress, Vue.js", "Delivers static content, product details, and the documentation portal to customers.")
        Container(vpn_app, "VPN Client App", "Flutter, Swift, Kotlin", "Provides native tunneling interface, subscription management, and proxy connection to the VPN.")
        Container(backend_v2, "Backend API Service V2", "NestJS, Node.js", "Provides REST APIs for account verification, subscription billing, node provisioning, and metrics.")
        Container(node_daemon, "VPN Node Daemon", "Node.js, WireGuard, iptables", "Runs on edge servers globally. Receives secure node tokens, configures WireGuard interfaces, and routes customer traffic to the open internet.")
        
        ContainerDb(database, "Primary Database", "Neon Serverless PostgreSQL", "Stores active subscriptions, anonymous connection mappings, sales contacts, and global node health telemetry.")
    }

    System_Ext(firebase, "Firebase Authentication", "External OAuth and Email/Password identity provider.")
    System_Ext(stripe, "Stripe Billing", "External payment processor handling subscriptions, invoices, and payment webhooks.")

    Rel(customer, website, "Visits", "HTTPS")
    Rel(customer, vpn_app, "Connects via", "WireGuard / App UI")
    
    Rel(vpn_app, firebase, "Authenticates via", "HTTPS")
    Rel(vpn_app, backend_v2, "Makes API calls to", "JSON/HTTPS")
    Rel(vpn_app, node_daemon, "Tunnels traffic through", "UDP/WireGuard")
    
    Rel(backend_v2, database, "Reads from and writes to", "Prisma ORM / TCP")
    Rel(backend_v2, firebase, "Verifies JWT tokens using", "Firebase Admin SDK")
    Rel(backend_v2, stripe, "Creates checkouts and syncs webhooks using", "Stripe API / HTTPS")
    
    Rel(node_daemon, backend_v2, "Registers and authenticates via", "HTTPS (Node Token)")
```

## Containers Description

* **Marketing Website**: A statically generated VitePress site deployed directly to edge CDNs (like Netlify or Vercel) focusing on fast load times, SEO, and developer documentation.
* **VPN Client App**: Native/Cross-platform applications installed on the user's mobile device or computer. Interacts primarily with the Backend V2 for subscription and server listing, and the Node Daemon for secure traffic routing.
* **Backend API Service V2**: A stateless, serverless-ready NestJS application leveraging Domain-Driven Design for managing the physical infrastructure mappings, verifying subscriptions via Stripe, and ensuring token validity relative to Firebase identities.
* **VPN Node Daemon**: A lightweight background service running on Linux VPS instances worldwide (provisioned by Ansible/Terraform) that strictly manages WireGuard peer addition/removal.
* **Primary Database**: Our persistence layer hosted on Neon, designed for serverless scalability.
* **External Systems**: Firebase and Stripe remove identity and payment compliance requirements from our direct servers.
