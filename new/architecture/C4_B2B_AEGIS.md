# C4 Model: KeenVPN B2B ("Project Aegis")

> **Scope**: Enterprise VPN / ZTNA (Security & Control Focus).
> **Notation**: C4 (Context, Containers, Components).

## Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram for KeenVPN B2B

    Person(employee, "Employee", "Staff member accessing company resources.")
    Person(admin, "IT Admin", "Manages policies, users, and audit logs.")
    
    System(aegis, "KeenVPN Aegis", "Zero Trust Network Access & VPN Platform.")

    System_Ext(idp, "Identity Provider", "Okta/Azure AD. Source of Truth for ID.")
    System_Ext(int_app, "Internal App", "Private resource (Jira, DB, SSH).")
    System_Ext(ext_web, "Public Internet", "External websites (SaaS/Browsing).")
    System_Ext(siem, "SIEM / Audit", "Splunk/Datadog. Ingests logs.")

    Rel(employee, aegis, "Connects via Client")
    Rel(admin, aegis, "Configures Policies")
    Rel(aegis, idp, "Syncs Users & Groups")
    Rel(aegis, int_app, "Proxies Traffic (Private Gateway)")
    Rel(aegis, ext_web, "Inspects Traffic (Secure Web Gateway)")
    Rel(aegis, siem, "Expletives Audit Logs")
```

## Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram for KeenVPN B2B

    Person(employee, "Employee")

    System_Boundary(device, "Employee Device") {
        Container(agent, "Aegis Agent", "Swift/Kotlin/Rust", "Enforces device posture. Tunnels traffic.")
    }

    System_Boundary(control, "Control Plane (SaaS)") {
        Container(dashboard, "Admin Dashboard", "React", "Policy mgmt UI.")
        Container(api, "Control API", "Go", "Policy Engine, IAM Sync, Device Auth.")
        Container(logger, "Audit Service", "Go", "Encrypts & Streams logs.")
    }

    System_Boundary(gateways, "Gateway Layer") {
        Container(swg, "Secure Web Gateway", "Cloud Cluster", "Filters Public Internet traffic. Anti-Phishing.")
        Container(priv_gw, "Private Gateway", "Docker/VM", "Runs in Company VPC. Provides access to private subnet.")
    }

    Rel(employee, agent, "Activates")
    Rel(agent, api, "1. Authenticate (SSO) & Get Policy", "HTTPS/OIDC")
    Rel(agent, swg, "2a. Internet Traffic", "WireGuard")
    Rel(agent, priv_gw, "2b. Internal Traffic", "WireGuard")
    
    Rel(priv_gw, api, "Register & Fetch Config", "mTLS")
    Rel(swg, logger, "Stream Logs", "gRPC")
    Rel(priv_gw, logger, "Stream Logs", "gRPC")
```

## Level 3: Component Diagram (Private Gateway)

```mermaid
C4Component
    title Component Diagram for Private Gateway (Customer Premise)

    Container_Boundary(gw, "Private Gateway") {
        Component(wg_engine, "WireGuard Engine", "Rust", "Terminates tunnels from Agents.")
        Component(policy_enf, "Policy Enforcer", "eBPF", "Allow/Deny based on User Group & Destination.")
        Component(connector, "Control Plane Connector", "Go", "Long-lived connection to API. Fetches updates.")
        Component(log_buffer, "Log Buffer", "Go", "Batches audit logs for async upload.")
    }

    Rel(wg_engine, policy_enf, "Passes Packets")
    Rel(connector, policy_enf, "Updates Rules")
    Rel(policy_enf, log_buffer, "Emits Events")
```

## Level 3: Component Diagram (Control API)

```mermaid
C4Component
    title Component Diagram for Control API

    Container_Boundary(api_layer, "Control API") {
        Component(idp_sync, "IdP Syncer", "Go", "SCIM listener for Okta/Azure users.")
        Component(ca, "Certificate Authority", "Go", "Issues short-lived certificates or WG Keys.")
        Component(policy_eng, "Policy Storage", "Postgres", "Stores ACLs (User A -> Resource B).")
    }

    Rel(idp_sync, policy_eng, "Updates User Groups")
    Rel(ca, policy_eng, "Verifies Access")
```
