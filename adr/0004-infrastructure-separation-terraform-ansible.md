# 4. Infrastructure Separation into Terraform and Ansible

Date: 2026-02-25

## Status

Accepted

## Context

Managing cloud infrastructure requires two distinct paradigms: provisioning external cloud resources (VPCs, Auto-Scaling Groups, Load Balancers) and configuring the internal software state of the virtual machines once they boot up. Initially or in previous monolithic attempts, configuration management and infrastructure-as-code (IaC) boundaries were blurred. To achieve scalable, predictable, and immutable infrastructure for the growing edge network of VPN nodes, we needed strict separation of concerns utilizing industry-standard tooling.

## Decision

We separate our deployment pipelines and repositories into two distinct layers:

1. **`infra-terraform`**: Handles all AWS infrastructure state provisioning. It dictates *what* resources exist (e.g., EC2 instances, Security Groups, IAM Roles, Secrets Manager).
2. **`infra-ansible`**: Handles configuration management and software bootstrapping. This is invoked post-boot (often orchestrated by Terraform/cloud-init or via dynamic inventory) to install dependencies like WireGuard, download the `infra-node-daemon`, and align the OS environment.

## Consequences

### Positive

* **Predictability**: Terraform state accurately maps to AWS without drift caused by runtime software updates.
* **Separation of Concerns**: DevOps engineers can alter routing and firewalls without touching the node software deployment manifest.
* **Idempotency**: Ansible ensures that if a node drifts, rerunning the playbook restores it to the desired state.

### Negative

* **Two Codebases**: Engineers must understand two different domain-specific languages (HCL for Terraform, YAML for Ansible).
* **Execution Handoff**: Requires a reliable orchestration handoff (e.g., passing dynamic IPs from Terraform outputs into Ansible inventories).
