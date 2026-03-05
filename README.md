# TuskBazaar

**A decentralized data marketplace built on Sui and Walrus.**

Upload, monetize, and purchase datasets — with end-to-end encryption, gasless transactions, and no wallet setup required.

[Live Demo](https://tuskbazaar.vercel.app) | [Smart Contracts](contracts/tuskbazaar/) | [Frontend](app/walrus-wildlife-fund/)

---

## What is TuskBazaar?

TuskBazaar is a fully on-chain data marketplace where anyone can sell and buy datasets. Data is encrypted client-side with AES-256-GCM, stored on **Walrus** (decentralized blob storage), and access-controlled via **Seal** (threshold encryption on Sui). Buyers pay in SUI and instantly gain decryption access — no intermediary, no centralized server holding your keys.

### Key Features

- **Zero-friction onboarding** — Sign in with Google via zkLogin (Enoki). No wallet installation, no seed phrases.
- **Gasless transactions** — All on-chain operations are sponsored via Enoki. Users never pay gas.
- **End-to-end encryption** — AES-256-GCM envelope encryption. The DEK is Seal-encrypted and stored on-chain. Only authorized readers can decrypt.
- **Walrus storage with quilts** — Single files stored as blobs; multi-file datasets bundled as Walrus quilts with per-patch retrieval.
- **Full asset lifecycle** — Upload, buy, archive, remove readers, delete blobs, destroy datasets — all managed through Move smart contracts.
- **Agent-ready APIs** — First-class support for AI agents and LLMs to programmatically browse, buy, and consume data.

---

## Architecture

```
                     ┌─────────────┐
                     │   Browser   │
                     │  (Next.js)  │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌──────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
        │  Sui Chain │ │  Walrus │ │  Seal Keys  │
        │  (Move)    │ │ Storage │ │ (Threshold  │
        │            │ │         │ │ Encryption) │
        └────────────┘ └─────────┘ └─────────────┘
```

| Layer | Technology | Role |
|-------|-----------|------|
| **Smart Contracts** | Sui Move (2024 edition) | Dataset registry, reader access control, payments, derived object IDs |
| **Storage** | Walrus (blobs + quilts) | Encrypted file storage with configurable duration (14–365 days) |
| **Encryption** | Seal + AES-256-GCM | Threshold-encrypted DEK on-chain; AES file encryption client-side |
| **Frontend** | Next.js 15, React 19, Tailwind v4 | Marketplace UI, upload wizard, dashboard, dataset viewer |
| **Auth** | Enoki / zkLogin (Google OAuth) | Passwordless login, sponsored transactions |

---

## How It Works

### Upload (Sell Data)

1. Sign in with Google (zkLogin) — wallet is created invisibly
2. Select files, set price, choose storage duration
3. App encrypts files with a random AES-256-GCM key (DEK)
4. Encrypted data is uploaded to Walrus (as blobs or quilts for multi-file datasets)
5. DEK is Seal-encrypted and stored on-chain as an envelope
6. Dataset object is created on Sui with metadata, blob IDs, and file manifest

### Purchase (Buy Data)

1. Browse the marketplace, find a dataset
2. Click "Buy" — a single sponsored transaction transfers SUI to the seller and grants reader access
3. Decryption key becomes available via Seal threshold protocol
4. Files are downloaded from Walrus, decrypted client-side, and delivered to the browser

### Manage (Full Lifecycle)

- **Dashboard** — View your published and purchased datasets with stats
- **Archive** — Prevent new readers from buying
- **Delete** — Remove all readers, destroy the on-chain object, delete Walrus blobs

---

## Walrus Integration

TuskBazaar makes extensive use of Walrus for decentralized storage:

### Blob Storage (CR-1, CR-2)
- **Write path**: Encrypted files uploaded via `PUT /v1/blobs` with configurable `epochs` parameter and `send_object_to` for ownership. Deletable blobs by default.
- **Read path**: Files downloaded via `GET /v1/blobs/{blobId}` from the aggregator. Handles missing/expired blobs with user-facing error messages.

### Quilt Storage (CR-3, CR-4)
- **Multi-file bundling**: When uploading 2+ files, TuskBazaar uses Walrus quilts (`PUT /v1/quilts`) with multipart form data. Each file gets a unique patch identifier (`patch-0`, `patch-1`, ...).
- **Patch retrieval**: Individual files retrieved by quilt patch ID (`GET /v1/blobs/by-quilt-patch-id/{patchId}`) or by quilt blob ID + identifier. Patch listing via `GET /v1/quilts/{quiltBlobId}/patches`.

### Upload History & Tracking (CR-5)
- Every upload records blob IDs and Sui blob object IDs in the on-chain `FileManifest` (JSON stored in `Dataset.file_manifest`).
- The dashboard displays all published and purchased datasets with their storage metadata.
- Blob object IDs are persisted for later deletion operations.

### Error Handling (CR-6)
- All Walrus operations (upload, download, quilt) have structured error handling with user-facing messages.
- Upload failures include status codes, payload sizes, and response bodies for debugging.

### On-Chain Asset Management (CR-7)
- Datasets are Sui Move objects with derived IDs, managed entirely through smart contracts.
- Reader access via dynamic fields. Payments, archival, reader removal, and destruction all on-chain.
- Account objects track owned and purchased datasets per address.

### Deletable Blob Lifecycle (CR-8)
- Blobs uploaded with `send_object_to` so the uploader owns the Walrus blob object.
- `useDeleteBlob` hook builds a PTB to delete blob objects on-chain (burning the Walrus storage object).

### Storage Cost Estimation (CR-9)
- Upload page displays estimated storage cost before upload: `~{(days / 30) * 0.5} SUI`.
- Shows maximum epoch limit (53 days on testnet) alongside the estimate.

### Epoch Extension (CR-10)
- Support for extending blob storage duration by additional epochs via the Walrus SDK.

### Integrity Verification (CR-11)
- AES-256-GCM encryption provides built-in integrity verification — the 16-byte GCM authentication tag ensures any tampering with blob data is detected during decryption.
- Decryption fails with a clear error if blob data has been modified or corrupted.

### Deployment (CR-12)
- Source code on GitHub
- Smart contracts deployed on Sui testnet
- Web app deployed at public URL

---

## Smart Contracts

Four Move modules in `contracts/tuskbazaar/sources/`:

| Module | What it does |
|--------|-------------|
| `tusk_bazaar.move` | Package initializer. Creates shared `TuskBazaarNamespace` with a global counter for deriving dataset IDs. |
| `account.move` | One-per-address `Account` object (derived). Tracks `own_datasets` and `read_datasets`. |
| `dataset.move` | Core `Dataset` object: metadata, envelope (Seal-encrypted DEK), blob IDs, file manifest, price, readers (dynamic fields), archive/destroy lifecycle. |
| `seal_approve_reader.move` | Seal entry function. Key servers dry-run this to verify the caller has reader access before releasing decryption shares. |

### Key Design Decisions

- **Derived object IDs** — Dataset and Account IDs are deterministically derived from the Namespace, so the frontend can compute them before the object exists (needed for Seal encryption).
- **Dynamic field readers** — `Reader(address)` as dynamic fields on Dataset. Cheap to add/check/remove, no vector iteration.
- **Envelope encryption** — Only the 32-byte DEK is Seal-encrypted (fast). File data uses standard AES-256-GCM (no size limits).

---

## Getting Started

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) (for contract development)
- Node.js 18+
- yarn or pnpm

### Smart Contracts

```sh
cd contracts/tuskbazaar
sui move build
sui move test
```

### Frontend

```sh
cd app/walrus-wildlife-fund
pnpm install   # or: yarn install
cp .env.example .env
# Fill in your Enoki API key and Google OAuth client ID
pnpm dev       # or: yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ENOKI_API_KEY` | Enoki public API key (zkLogin + sponsorship) |
| `ENOKI_SECRET_KEY` | Enoki secret key (server-side sponsorship) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_PACKAGE_ID` | Deployed Move package ID |
| `NEXT_PUBLIC_PLATFORM_OBJECT_ID` | TuskBazaarNamespace object ID |

---

## Tech Stack

| | Technology |
|---|-----------|
| **Blockchain** | Sui (testnet) |
| **Smart Contracts** | Move 2024 edition |
| **Storage** | Walrus (blobs + quilts) |
| **Encryption** | Seal (threshold) + AES-256-GCM |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind v4 |
| **Auth** | Enoki / zkLogin (Google OAuth) |
| **Animations** | Motion (Framer Motion) |
| **Transport** | Sui gRPC client |

---

## Project Structure

```
contracts/tuskbazaar/
  sources/
    tusk_bazaar.move          # Namespace + OTW init
    account.move              # Per-user account object
    dataset.move              # Dataset CRUD + payments
    seal_approve_reader.move  # Seal access verification

app/walrus-wildlife-fund/
  src/
    app/                      # Next.js pages + API routes
    components/               # Reusable UI components
    hooks/                    # React hooks (upload, feed, dashboard, delete)
    lib/                      # Core libraries (seal, crypto, walrus, sui-helpers)
```

---

## License

MIT
