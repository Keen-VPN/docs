# Infrastructure Detailed Reference Architecture (IDRA)

> **Component**: VPN Exit Nodes (The Data Plane).
> **OS**: Alpine Linux Edge (Minimal Attack Surface).
> **Role**: Ephemeral, Stateless, High-Performance Packet Forwarding.

## 1. Operating System Strategy

We use **Alpine Linux** for its minimal footprint (<50MB RAM) and "Hardened by Default" (musl libc, stack smashing protection) nature.

### Disk Layout & RAM Disks

* `/`: Read-only root (SquashFS or similar immutable setup if provider supports it).
* `/var/log`: `tmpfs` (RAM). Logs are NEVER written to disk.
* `/etc/wireguard`: `tmpfs` (RAM). Keys exist only in memory across reboots (or re-provisioned).

### Boot Process (Cloud-Init)

1. **Provision**: Cloud Provider boots instance.
2. **Init**: `cloud-init` via Ansible runs.
    * Disables SSH Password Auth.
    * Downloads latest `node-daemon` binary from secure Github release artifacts.
    * Dynamically fetches the `NODE_TOKEN` from AWS Secrets Manager for backend authentication.
    * Starts `node-daemon` systemd service.
3. **Registration**: `node-daemon` generates its unique Keypair and securely calls the backend API to register its availability.

## 2. Kernel Tuning (sysctl.conf)

Optimized for 10Gbps+ UDP forwarding.

```ini
# Enable Forwarding
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1

# BBR Congestion Control (Better throughput)
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# UDP Buffer Sizes (Crucial for WireGuard high-speed)
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.udp_mem = 8388608 12582912 16777216

# Hardening (Prevent Source Routing / Redirects)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
```

## 3. Network Security (nftables)

We replace `iptables` with `nftables` for atomicity and performance.

### Logic

* **Input**: Drop everything except:
  * UDP/51820 (WireGuard)
  * SSH (Bastion Only)
  * ICMP (Rate Limited)
* **Forward**: Allow traffic from `wg0` interface.
* **Postrouting**: Masquerade (NAT) traffic leaving `eth0`.

### nftables.conf

```ruby
table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        
        # Allow established traffic
        ct state established,related accept
        
        # Allow Loopback
        iif "lo" accept
        
        # Allow WireGuard
        udp dport 51820 accept
        
        # Allow SSH (Strictly controlled via Security Groups usually, but explicit here too)
        tcp dport 22 accept
        
        # Rate limit Ping
        ip protocol icmp icmp type echo-request limit rate 1/second accept
    }
    
    chain forward {
        type filter hook forward priority 0; policy drop;
        
        # Allow Traffic appearing from WireGuard interface
        iifname "wg0" accept
        ct state established,related accept
    }
}

table ip nat {
    chain postrouting {
        type nat hook postrouting priority 100;
        
        # Masquerade traffic leaving external interface (NAT)
        oifname "eth0" masquerade
    }
}
```

## 4. The Agent: `node-daemon` (Node.js)

A lightweight Node.js service running on the metal.

### Responsibilities

1. **Heartbeat**: Pings `Config Service` every 10s with Load stats.
2. **Config Sync**: Syncs WireGuard Peers (add/remove) based on Backend state.
3. **Metrics**: Exposes strictly anonymized interface stats.

### Pseudocode (Daemon Logic)

```javascript
class NodeDaemon {
  async start() {
    this.keyPair = await WireGuard.getOrGenerateKeys();
    this.config = await loadConfig();
    
    // 1. Register Availability
    await Backend.register({
      public_ip: this.config.publicIp,
      pub_key: this.keyPair.publicKey,
      location: this.config.region
    });

    // 2. Main Event Loop
    setInterval(async () => {
      const state = await this.syncState();
      await this.reportHealth(state);
    }, 10_000); // 10s
  }

  async syncState() {
    // Fetch authorized peers from Backend
    // Delta sync preferred to save bandwidth
    const targetPeers = await Backend.detchPeerList();
    
    // Apply to Interface (Exec 'wg' or use native Netlink binding)
    // CRITICAL: Minimal disruption. Don't flap interface.
    await WireGuard.syncPeers("wg0", targetPeers);
    
    return System.getMetrics(); // CPU, Bandwidth
  }
}
```

### Architecture

* **Runtime**: Node.js (Current LTS). packaged as a single binary using `pkg` or `bun`.
* **Libs**: `child_process` (for `wg` calls) or `netlink` native binding.

## 5. Lifecycle Strategy

### Auto-Scaling

* **AWS ASG**: Managed via `infra-terraform`, scaling dynamically based on load thresholds.
* **Secrets Management**: Critical infrastructure secrets (`NODE_TOKEN`, `FIREBASE_PRIVATE_KEY`, `BLINDED_SIGNING_PRIVATE_KEY`) are stored natively in AWS Secrets Manager across each unique environment (Staging/Production). This removes hardcoded credentials across server boundaries.

### Reputation-Based Draining (The "Grim Reaper")

* **Trigger**: We **ONLY** kill nodes if they are detected as **Blocked** (IP Reputation screwed) or **Compromised**.
* **Detection**: External "Canary" service checks IP against major streaming services and mailing lists.
* **Flow**:
    1. Monitor detects Node X IP is blacklisted (e.g., by Netflix or Spamhaus).
    2. Monitor calls Backend: `POST /node/drain { id: "node-x", reason: "blocked" }`.
    3. Backend removes Node X from "Availability Pool" (No new user allocations).
    4. `node-daemon` receives "Drain" flag in next heartbeat.
    5. `reap_nodes` script waits for connections == 0, then Terminate.
