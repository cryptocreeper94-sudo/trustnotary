# Security Policy — TrustNotary

## Architectural Security Controls

- **SHA-256 Hash-Chained Electronic Journal**: Every Tennessee Online Notary journal entry chains the prior entry hash and verifies genesis-to-head integrity (`T.C.A. § 8-16-301`).
- **HMAC-Verified Signer Vault PINs**: Per-booking 6-digit Signer Vault PINs are derived and verified with HMAC-SHA256; uploaded PDFs are SHA-256 fingerprinted on receipt.
- **Atomic Slot Locking**: SQLite WAL mode with `BEGIN IMMEDIATE` transactions eliminates double-booking race conditions.
- **Parameterized Queries & Path Containment**: All SQL statements are strictly parameterized and upload paths are confined to the persistent `/app/data/uploads` volume.

## Reporting a Vulnerability

Please **do not** open public GitHub issues for suspected security vulnerabilities, cryptographic flaws, or credential exposure.

- **Email:** `team@dwsc.io` (Subject: `[SECURITY] TrustNotary`)
- **Organization:** DarkWave Studios LLC (https://darkwavestudios.io)
- **Acknowledgment Target:** Within 48 hours of receipt
- **Remediation Target:** Critical issues patched and deployed within 72 hours

Include reproduction steps, affected endpoints or modules, and impact assessment where possible. Good-faith security research conducted without data exfiltration or service disruption is welcomed under safe harbor.
