# Connection Module

The Connection module handles all telemetry sent by the VPN Nodes regarding active sessions and bandwidth usage.

## Telemetry Tracking

- When a client connects or disconnects to a node, the Node Daemon fires a webhook to the `ConnectionController`.
- The `ConnectionService` logs this payload into the `ConnectionSession` database table.
- Bandwidth usage is periodically aggregated into `SessionAggregate` to prevent the database from growing unbounded while still offering accurate accounting of gigabytes used per client.
