# Subscription Module

The Subscription module governs access control to the VPN capabilities. It acts as the source of truth determining if a user's `SubscriptionStatus` is `ACTIVE`, `CANCELED`, or `EXPIRED`.

## Webhook Synchronization

The `SubscriptionController` listens constantly to `POST /subscription/stripe-webhook`.
It validates the Stripe cryptographic signature, then processes events like `checkout.session.completed` or `customer.subscription.deleted`. This asynchronous replication guarantees our internal database perfectly mirrors the truth held in Stripe without making blocking synchronous calls to Stripe API during user login.
