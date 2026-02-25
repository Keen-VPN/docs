# Nodes Module

The Nodes module acts as the fleet manager for the VPN infrastructure globally.

## Node Registry

It exposes endpoints for the VPN Node Daemon to periodically "check in". During a check in, the node reports its CPU, Memory, and Active Connections.

## Geographic Routing

When a client queries the `/nodes/optimal` endpoint, the `NodesService` filters out offline edge nodes and sorts the remaining active pool based on:

1. Proximity to the user (via GeoIP).
2. Minimal connection load to achieve maximum throughput.
