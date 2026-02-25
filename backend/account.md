# Account Module

The Account module is responsible for managing the user's primary profile and associating their external identity (e.g., Firebase UID) with our internal `User` record in the database.

## Architecture

- **`AccountController`**: Exposes REST endpoints for fetching and updating user profiles. Includes the `GET /account/me` endpoint.
- **`AccountService`**: Handles the business logic of retrieving user data, ensuring the user exists in our database or lazily creating the record if they are authenticating for the first time via Firebase.

## Dependencies

- **AuthModule**: Protects the endpoints using standard guards.
- **PrismaModule**: Connects to the database to fetch the `User` model.
