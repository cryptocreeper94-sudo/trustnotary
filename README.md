# TrustNotary — Tennessee Online (RON) & Middle TN Mobile Notary Platform

Built 100% in **Lume (`lume-lang` v1.1.0)** by **DarkWave Studios LLC** and aligned to the **42-Doctrine Deterministic Dissolution Ladder**.

## Key Capabilities
- **Zero-Printer Revenue Launch**:
  - **Remote Online Notarization (RON)**: Live webcam notarization from anywhere (`$25` statutory first seal per **T.C.A. § 8-16-301**).
  - **Middle TN Mobile General Notary Work**: Hospital/bedside POAs, living wills, attorney-printed trusts, vehicle titles, and remote-hire Form I-9 Authorized Representative inspections dispatched from **37090 (Gladeville / Lebanon)** across Wilson, Rutherford, and Davidson Counties with upfront itemized ZIP travel quotes (**T.C.A. § 8-21-1201**).
  - **Commercial / B2B Partner Desk (`/b2b`)**: Fast-track intake for estate law firms, general contractors (AIA G702/G703 & lien waivers), HR People Ops, and property managers.
- **Deterministic Central-Time Scheduler (`src/scheduler.lume`)**:
  - Explicit `America/Chicago` epoch calculation (zero browser-vs-UTC timezone drift).
  - Pre/post travel & session buffers, minimum lead-time guards, blackout dates, and SQLite `BEGIN IMMEDIATE` atomic overlap locking.
- **Private Signer Vault (`/portal`)**:
  - 6-digit HMAC-verified Vault PIN per booking, unsigned PDF upload (stored on persistent volume `/app/data/uploads`) with automatic **SHA-256** tamper-evident fingerprinting, itemized receipt, and live RON room join button.
- **Owner Admin Cockpit (`/admin`)**:
  - **SHA-256 Hash-Chained Tennessee Electronic Notary Journal** with genesis-to-head integrity verification and JSON backup export.
  - **Built-in Tennessee Circular Digital Notary Seal Studio** (`src/seal.lume`) exporting crisp `1040×1040` transparent PNG stamps for TN Secretary of State Online Notary registration and BlueNotary (`$0` external stamp cost) + shareable `1200×720` booking card PNG generator.

## 42-Doctrine Alignment Matrix

| Layer | Doctrines | Module Mapping |
|---|---|---|
| Identity & Structure (1–7) | `[01]` Identity Kernel, `[02]` Boundary Engine, `[03]` Differentiation, `[07]` Locality | `src/catalog.lume`, `src/server.lume`, `src/web/app.lume`, `/app/data` volume |
| Cognition & Reference (8–12) | `[08]` Temporal Determinism, `[09]` Ontology Model | `src/scheduler.lume`, `src/shim/lume-interop.mjs` (`America/Chicago`) |
| Constraint & Determinacy (13–17) | `[13]` Constraint Engine, `[14]` Determinacy Engine | `src/pricing.lume` (`$25` T.C.A. § 8-16-301 cap + deterministic ZIP zones) |
| System & Coherence (18–27) | `[21]` Stability Layer, `[22]` Continuity Layer | `src/store.lume` (WAL SQLite + `BEGIN IMMEDIATE` slot locking + buffers) |
| Integration & Resolution (28–34) | `[28]` External Coupling, `[29]` Integration, `[32]` Integrity Layer | `src/notifications.lume` (Resend + Stripe), `src/seal.lume`, SHA-256 Journal |
| Safety Envelope (35–42) | `[35]` Collapse Detection, `[37]` Null Boundary, `[40]` Non-Being Guard | Parameterized SQL, structured error envelopes, safe static/upload paths |

## Build, Test & Run

```bash
npm install
npm run build
npm test
npm start
```

Deployed as a Dockerized Coolify container (`Dockerfile` with `/api/health` healthcheck and `/app/data` persistent volume; zero PM2).

