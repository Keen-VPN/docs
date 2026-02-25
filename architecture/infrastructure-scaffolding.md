# Infrastructure Scaffolding & File Structure

> **Purpose**: Defines the layout for managing VPN Nodes via Infrastructure as Code (IaC).
> **Tools**: Terraform (Provisioning), Ansible (Configuration), Bash/Python (Glue).

## 1. Directory Tree Overview

```text
/infrastructure
├── terraform/
│   ├── modules/                  # Reusable Cloud Components
│   │   ├── vpn-node/            # The Exit Node Definition
│   │   └── network/             # VPC, Subnets, Firewalls
│   └── live/                     # Environment Instantiations
│       └── prod/
│           ├── us-east-1/       # Region Specific
│           └── eu-central-1/
├── ansible/
│   ├── playbooks/                # Orchestration Scripts
│   └── roles/                    # Configuration Units
│       ├── common/              # OS Hardening (Alpine)
│       ├── wireguard/           # WG Kernel Module & Tools
│       └── daemon/              # The 'node-daemon' Service
└── scripts/                      # Lifecycle Automation
```

## 2. Terraform Detail (`/infrastructure/terraform`)

### Modules

#### `modules/vpn-node/`

* **`main.tf`**: Defines the `aws_instance` (or cloud equivalent). Sets `user_data` to bootstrap the node.
* **`security_group.tf`**: Defines `aws_security_group`. Allows Inbound UDP/51820 (World) and TCP/22 (Bastion Only).
* **`variables.tf`**: Inputs for `ami_id`, `instance_type` (default `c5n.large`), `region`, `ssh_key`.
* **`outputs.tf`**: Exports `public_ip` and `instance_id` for use by the State Manager.
* **`user_data.sh`**: The cloud-init script. Installs Python/Ansible to prepare for configuration, or downloads the `node-daemon` binary directly.

#### `modules/network/`

* **`main.tf`**: Creates a VPC (if not using default).
* **`subnets.tf`**: Defines Public Subnets for the VPN nodes.
* **`igw.tf`**: Internet Gateway attachment.

### Live Environments

#### `live/prod/us-east-1/`

* **`main.tf`**: Instantiates `module "vpn-node"`. Sets the provider region to `us-east-1`.
* **`backend.tf`**: Configures S3 backend for Terraform State (locking via DynamoDB).
* **`terraform.tfvars`**: Region-specific settings (e.g., `capacity_count = 5`).

## 3. Ansible Detail (`/infrastructure/ansible`)

### Playbooks

#### `playbooks/provision_node.yml`

* **Summary**: The master playbook run on new nodes.
* **Targets**: `vpn_nodes` (Dynamic Inventory).
* **Roles**: `common`, `wireguard`, `daemon`.

### Roles

#### `roles/common/`

* **`tasks/main.yml`**:
  * Updates system packages (`apk upgrade`).
  * Configures NTP/Chrony.
  * Hardens Sysctl (IP Forwarding On, Redirects Off).
  * Configures `nftables` (Drop all except 51820/22).
* **`files/sysctl.conf`**: The optimized kernel parameters for high-speed UDP.

#### `roles/wireguard/`

* **`tasks/main.yml`**:
  * Installs `wireguard-tools`.
  * Generates Keypair (if not handled by daemon).
  * Sets up the `wg0` interface.
* **`templates/wg0.conf.j2`**: Jinja2 template for the interface config.

#### `roles/daemon/`

* **`tasks/main.yml`**:
  * Downloads `node-daemon` binary from S3 Artifacts.
  * Installs systemd/OpenRC service file.
  * Starts and enables the service.
* **`templates/node-daemon.service.j2`**: Systemd unit file definition.
* **`vars/main.yml`**: Configuration for the daemon (e.g., Config Service URL, Auth Tokens).

## 4. Scripts (`/infrastructure/scripts`)

### `deploy_nodes.sh`

* **Summary**: Wrapper around Terraform.
* **Usage**: `./deploy_nodes.sh us-east-1 10` (Spin up 10 nodes in Virginia).
* **Logic**: Updates `terraform.tfvars`, runs `terraform apply -auto-approve`.

### `reap_nodes.py`

* **Summary**: The "Grim Reaper" script.
* **Logic**:
    1. Queries Config Service for nodes marked "Drain" (due to Blocklist/Reputation).
    2. If active connections == 0, Calls Terraform/Cloud API to terminate.
    3. Runs as a Cron Job every 5 minutes.

### `build_daemon.sh`

* **Summary**: CI/CD script.
* **Logic**: Bundles the Node.js daemon using `pkg` (into a single binary), signs it, and uploads to S3 bucket.
