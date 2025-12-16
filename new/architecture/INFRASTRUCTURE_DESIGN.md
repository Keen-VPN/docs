# Infrastructure Design: The "Ghost" Grid

## Philosophy

The backend infrastructure is designed to be **Ephemeral**, **Stateless**, and **Invisible**.
We do not maintain "Servers"; we maintain "Capacity". A node exists only as long as it is healthy and needed.

## 1. The VPN Node (The Data Plane)

* **Provider Independent**: Can run on AWS, GCP, DigitalOcean, or Bare Metal.
* **Operating System**: Alpine Linux (Edge).
* **Runtime Config**:
  * **Cloud-Init**: Bootstraps the node.
  * **RAM Disk**: All logs and operational data stored in `/tmp` (RAM).
  * **Networking**:
    * `sysctl -w net.ipv4.ip_forward=1`
    * `iptables` for NAT masquerade.
    * WireGuard optimization (MTU 1280-1420 dynamic).
* **Lifecycle**:
  * **TTL**: 24 Hours.
  * **Reboot Strategy**: Rolling replacements. NO UPDATES. If a patch is needed, we destroy the old nodes and spin up new images.

## 2. The Control Plane (The Brain)

* **Orchestrator**: Kubernetes (EKS/GKE) or a lightweight Go control binary ("Herder").
* **Functions**:
  * **Health Checks**: Ping nodes every 10s.
  * **Load Balancing**: Assign user to the least loaded node (via Config Service).
  * **Capacity Planning**: Auto-scale based on bandwidth aggregate.

## 3. Deployment Strategy (Terraform)

* **Modules**:
  * `modules/vpn-node`: The instance template.
  * `modules/network`: VPC, Subnets, Firewalls (Allow UDP 51820, Allow SSH from Bastion ONLY).
* **Multi-Region**:
  * `us-east-1` (Virginia)
  * `eu-central-1` (Frankfurt)
  * `ap-northeast-1` (Tokyo)

## 4. Hardening Checklist

* [ ] Root login disabled.
* [ ] SSH via Ed25519 keys only.
* [ ] Unattributed ports blocked by Security Groups.
* [ ] Kernel hardening (disable ICMP redirect, disable source routing).
