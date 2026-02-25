# Payment Module

The Payment module facilitates the immediate integration with Stripe specifically for generating checkout sessions and executing the initial payment flows.

## Architecture

- Acts as a bridge between the frontend and Stripe Checkout.
- **`PaymentService`**: Receives an intention (e.g., "User wants to buy the Pro Annual Plan"), looks up the corresponding Stripe Price ID mapping from config, and initializes a secure Stripe Checkout Session URL which the client is redirected to.
