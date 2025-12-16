# VPN Connection Security & Subscription Bypass Analysis

> **Date:** 2025-12-08
> **Auditor:** Antigravity (AI System Implementation)
> **Status:** Critical Vulnerability Confirmed

## 1. Executive Summary
An analysis of the VPN connection implementation on iOS, macOS, and the Backend reveals a critical architectural flaw. The system uses a **Static Shared Credential** model for IKEv2 authentication. A single username/password pair is hardcoded into the application and the backend codebase, allowing any user (or non-user) to bypass subscription checks and connect directly to the VPN servers.

**Result:** 🔴 **CRITICAL FAIL** - Subscription Bypass Confirmed

## 2. Vulnerability Details

### V-06: Static Shared Credentials (Subscription Bypass)
*   **Severity:** 🚨 **CRITICAL**
*   **Components:** `vpn-ios-app`, `vpn-backend-service`
*   **Artifacts:**
    *   iOS: `VPNConfigService.swift` (Lines 375-377)
    *   Backend: `src/routes/config.ts` (Lines 60-64)
*   **Finding:**
    The application logic relies on fetching a configuration JSON. However, a "Fallback Configuration" is hardcoded into the app binary containing:
    *   **Username:** `client`
    *   **Password:** `KeenVPNClient2024Secure`
    *   **Endpoints:** `3.225.112.116` (US), `169.255.57.34` (Nigeria)

    This same configuration is present as a fallback in the backend. This indicates the VPN Servers (StrongSwan) are configured to accept this single static credential.

*   **Exploit Scenario:**
    1.  Attacker extracts the string `KeenVPNClient2024Secure` from the IPA or source code.
    2.  Attacker configures a standard IKEv2 client (Windows, macOS Native, Linux StrongSwan) with these credentials and the IP `3.225.112.116`.
    3.  Attacker connects successfully, consuming bandwidth without a valid subscription and bypassing the app's billing logic entirely.

## 3. Remediation Strategy

### A. Immediate Mitigation (Stop the Bleeding)
1.  ** Rotate Credentials**: Change the password on the StrongSwan servers immediately. This will break the app for updated users but stop freeloaders.
2.  **API-Gated Config**: Ensure the API *never* returns the password in plaintext. The `fetchVPNConfig` endpoint currently returns the full config object, likely including the password.

### B. Long-Term Architecture (Robust Enforcement)
To properly enforce subscriptions, the VPN Server must authenticate the user against the Backend Database at the moment of connection.

#### Option 1: RADIUS / EAP Integration (Recommended)
1.  Configure StrongSwan to use `eap-radius` plugin.
2.  Deploy a FreeRADIUS server that queries the PostgreSQL database (or an API endpoint).
3.  **Auth Flow**:
    *   User connects with `username = <session_token>`, `password = <empty/constant>`.
    *   VPN Server -> RADIUS -> Backend API (`/verify-session`).
    *   Backend checks subscription status.
    *   If active -> `Access-Accept`.
    *   If expired -> `Access-Reject`.

#### Option 2: Short-Lived Certificates
1.  Backend acts as an internal CA.
2.  App authenticates via HTTP (Firebase Token).
3.  Backend issues a client certificate valid for 24 hours.
4.  App configures IKEv2 with this certificate.
5.  VPN Server verifies certificate validity (signed by internal CA).
6.  **Pros**: No need for real-time database lookups on the VPN node.
7.  **Cons**: Complexity of PKI management.

## 4. Updates to Security Report
This document serves as an addendum to `AUTH_AUDIT_REPORT.md`, identifying **V-06** as the highest priority risk.
