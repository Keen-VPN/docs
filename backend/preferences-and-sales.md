# Preferences & Sales Module

This module consolidates custom onboarding actions and B2B contact logic.

## Sales Contact

To support B2B enterprise deals, the `SalesContactController` allows capturing inbound form submissions.
The `SalesContactService` implements strict validation and a 15-minute anti-spam throttle, capturing the requester's intent directly into the relational DB and resolving a `KVPN-XYZ` tracking ID.

## Server Preferences

Tracks default configurations stored persistently for a given user, such as whether they default to "Always Auto-Connect to US-EAST" bypassing the automated latency router.
