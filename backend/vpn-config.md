# VPN Config Module

The absolute core routing mechanism mapping anonymous clients to active edge nodes.

## The 1:1 Restriction

When a client wants to connect to a specific node, the `VPNConfigService` looks up their `Wireguard Public Key`.
To ensure cryptographic routing tables don't overlap or pollute, the system strictly enforces a `@unique` constraint: one globally unique Public Key is mapped to at most **one** VPN Node at any time.

## IP Assignment

The service scans the assigned `10.8.0.0/16` subset for the specified edge node and predictably allocates a `10.8.x.x` internal IP address to the client, recycling it across sessions to stabilize routing.

Once associated, the backend issues an asynchronous push request (or waits for the Node Daemon polling cycle) to update the `iptables` and Wireguard config on the physical server to allow traffic from that newly assigned IP.
