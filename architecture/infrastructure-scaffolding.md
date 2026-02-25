# Infrastructure Scaffolding & Repositories

> **Purpose**: Defines the layout for managing VPN Nodes via separated Infrastructure as Code (IaC) repositories to isolate provisioning, configuration, and execution boundaries.
> **Tools**: Terraform, Ansible, Node.js (Edge Node Daemon).

## 1. Repository Ecosystem

Instead of a monolithic infrastructure repo, KeenVPN uses three distinct repositories for independent lifecycles.

```text
/Workspace
├── /infra-terraform/          # AWS Cloud Resources Provisioning
├── /infra-ansible/            # Instance Configuration & Hardening
└── /infra-node-daemon/        # Node.js Edge Process 
```

## 2. Terraform Detail (`infra-terraform`)

Manages AWS primitives, network boundaries, API configurations, and cryptographic secrets.

### Modules & Services

- **`main.tf`**: Roots the AWS configuration and orchestrates instances.
- **`secrets.tf`**: AWS Secrets Manager instantiations (storing variables like `NODE_TOKEN`, `FIREBASE_PRIVATE_KEY`, `BLINDED_SIGNING_PRIVATE_KEY` for different staging and production parity environments).
- **`auto-scaling.tf`**: Launch templates and threshold-based capacity governors.
- **`network/`**: VPC, Subnets, and Firewalls.
- **Security Policy**: Allow Inbound UDP/51820 (WireGuard World) and TCP/22 (Bastion Only).

## 3. Ansible Detail (`infra-ansible`)

Orchestrated to automatically baseline instances booted via Terraform ASG templates.

### Roles

- **`common`**: OS Hardening (Alpine), Kernel Sysctl performance tweaks optimized for UDP, Time chrony.
- **`wireguard`**: Installs Kernel Modules and interfaces `wg0`.
- **`node-daemon`**: Mounts the systemd listener script, dynamically pulls the required `NODE_TOKEN` from AWS Secrets Manager using IAM Instance Profiles, and bootstraps the runtime.

## 4. Node Daemon Detail (`infra-node-daemon`)

The isolated source code for the edge processor operating on each server.

- **Summary**: A tightly bundled Node.js application packaged with Node v20+.
- **Responsibilities**: Executes local WireGuard bindings (`wg` cli proxy), tracks session active bandwidth and latency, and negotiates state securely with the `vpn-backend-service-v2` master monolith.
