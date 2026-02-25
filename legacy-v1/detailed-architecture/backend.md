# Backend Service Architecture

## 1. Overview
The Backend Service (`vpn-backend-service`) is a Node.js/Express REST API that acts as the control plane for the KeenVPN ecosystem. It handles user management, billing, and VPN session reporting.

*   **Runtime**: Node.js v20 (Alpine Docker)
*   **Framework**: Express.js
*   **Database**: PostgreSQL (managed via Prisma)
*   **Auth**: Firebase Auth + Custom Session Tokens

## 2. Database Schema (Prisma)

### Core Models

#### `User`
The central identity record.
*   `id`: UUID
*   `firebaseUid`: Link to Firebase Auth.
*   `stripeCustomerId`: Link to Stripe.
*   `appleUserId`: Specific for Apple Sign-In (handles private relay).

#### `Subscription`
Manages access entitlements.
*   `userId`: FK to User.
*   `status`: `active`, `trialing`, `cancelled`, `past_due`.
*   `subscriptionType`: `stripe` or `apple_iap`.
*   **Constraint**: Unique composite index on `stripeSubscriptionId` + `currentPeriodStart` to handle renewals.

#### `ConnectionSession`
Telemetery for usage tracking.
*   `userId`: FK to User.
*   `durationSeconds`: Session length.
*   `bytesTransferred`: Data usage.
*   `terminationReason`: `USER_TERMINATION` or `CONNECTION_LOST`.
*   **Privacy Note**: `serverAddress` is stored for troubleshooting but should be anonymized in the future.

#### `AppleIAPPurchase`
Ledger of Apple In-App Purchases.
*   `originalTransactionId`: The stable identifier for a subscription.
*   `linkedUserId`: The KeenVPN user currently claiming this purchase.

## 3. API Specification

### Authentication (`/api/auth`)
*   `POST /apple/signin`: Handles Apple Sign-In, validates identity token, creates/updates user, and handles "blacklisted" (deleted) user checks (5-minute cool-down).
*   `POST /login`: Standard Firebase login exchange.

### Connection Management (`/api/connection`)
*   `POST /session`: Report session start/end/heartbeat.
    *   **Middleware**: `requirePaidOrTrial` ensures only active users can report (and thus use) the service.
    *   **Body**: `session_start`, `duration_seconds`, `platform`, `bytes_transferred`.

### Subscriptions (`/api/subscription`)
*   `POST /webhook`: Handler for Stripe webhooks (`checkout.session.completed`, `customer.subscription.*`).
    *   **Logic**: Creates new `Subscription` record for each billing period to maintain history.
    *   **Concurrency**: Uses Prisma atomic operations to prevent duplicate processing.

## 4. Key Workflows

### Apple IAP Linking
When a user subscribes via iOS IAP:
1.  Client sends receipt/transaction info to Backend.
2.  Backend verifies transaction with Apple (implied/future) and records in `AppleIAPPurchase`.
3.  Logic checks if `originalTransactionId` is already linked to another user.
4.  If not linked, creates a `Subscription` record with type `apple_iap` and links the purchase.

### Trial Logic
Trials are managed via `TrialService`.
*   Trials are granted **only** when a subscription is initiated (Stripe or IAP) but in the "trialing" state.
*   `TrialGrant` table tracks device hashes to prevent trial abuse.
