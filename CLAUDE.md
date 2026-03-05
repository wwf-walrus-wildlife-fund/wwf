# TuskBazaar — Decentralized Data Marketplace

Data marketplace dApp on Sui. Users upload, monetize, and purchase datasets.
Data is stored encrypted on **Walrus** (decentralized blob storage), access-controlled via **Seal** (threshold encryption).

## Project Structure

```
contracts/tuskbazaar/     # Sui Move smart contracts (edition 2024)
app/walrus-wildlife-fund/ # Next.js 15 frontend (App Router, React 19, Tailwind v4)
```

## Smart Contracts (`contracts/tuskbazaar/sources/`)

| Module | Purpose |
|--------|---------|
| `tusk_bazaar.move` | Namespace/factory — OTW init, shared `TuskBazaarNamespace` with global dataset counter |
| `account.move` | Account object (shared, derived): 1 per address, tracks `own_datasets` and `read_datasets` |
| `dataset.move` | Core Dataset object (shared, derived): metadata, readers (dynamic fields), envelope, blob_ids, file_manifest, price, archive/destroy |
| `seal_approve_reader.move` | Seal entry function — validates reader access for decryption (dry-run only, no side effects) |

### Move Patterns

- **Account**: Shared object, 1 per address. Derived from `namespace_id + AccountTag(sender)`. Tracks `own_datasets: VecSet<ID>` and `read_datasets: VecSet<ID>`.
- **Namespace counter**: Global incrementing `u64` counter in `TuskBazaarNamespace`, used as derivation key for Dataset IDs
- **Derived objects**: `sui::derived_object` — Account from `namespace_id + AccountTag(address)`, Dataset from `namespace_id + counter`
- **Reader access**: Dynamic fields with `Reader(address)` key on Dataset UID. Creator auto-added as reader. `readers_count` tracks paid readers.
- **Direct payment**: `dataset.pay_sui_to_read()` — validates payment amount, transfers to `funds_receiver`, adds reader DF + updates buyer's Account. Rejects if dataset is archived.
- **Envelope**: `{ encrypted_key: vector<u8>, version: u64 }` — Seal-encrypted DEK with rotation version
- **blob_ids**: `VecSet<String>` (u256 stored as String for explorer readability)
- **File manifest**: `file_manifest: String` — JSON manifest with file names, sizes, mimeTypes, storageType (`blobs` | `quilt`)
- **Archive & delete**: `archive()` marks dataset as archived (no new readers). `remove_reader()` removes a reader (owner only). `destroy()` deletes the Dataset object (requires all readers removed first).
- **Error constants**: `const EDescriptiveName: u64 = N`
- **Visibility**: `public(package)` for internal functions, `entry` for Seal approve

### Dataset Fields

```move
public struct Dataset has key {
    id: UID,
    owner_id: ID,
    name: String,
    description: String,
    image_url: String,
    project: String,
    project_url: String,
    incr_index: u64,
    derivation_id: ID,
    envelope: Envelope,
    blob_ids: VecSet<String>,
    file_manifest: String,      // JSON FileManifest
    price_sui: u64,
    funds_receiver: address,
    readers_count: u64,
    archived: bool,
}
```

### Build & Test

```sh
cd contracts/tuskbazaar
sui move build
sui move test
```

## Flows

### Create Dataset (Upload)
1. Read current counter from Namespace to derive Dataset object ID (`namespace_id + counter`)
2. Generate random AES-256-GCM DEK (32 bytes)
3. Encrypt each file with DEK → ciphertext (wire format: `[IV 12B][ciphertext+authTag]`)
4. Upload encrypted data to Walrus — either as individual blobs or as a **quilt** (multi-file bundle, used when 2+ files)
5. Seal-encrypt DEK: `sealClient.encrypt({ threshold, packageId, id: [dataset_id || version_0], data: dek })` → encrypted envelope
6. Build JSON `FileManifest` with file names, sizes, mimeTypes, storageType, blobObjectIds
7. If Account doesn't exist yet, create it in same PTB
8. Call `dataset::new_derived(namespace, account, ...)` + `dataset::share()` on-chain

### Buy Reader Access — By Paying SUI
1. User calls `dataset.pay_sui_to_read(dataset, payment, account, ctx)`
2. Validates `!archived`, `payment.value() == dataset.price_sui`, `sender == account.owner`
3. Transfers payment to `dataset.funds_receiver`
4. Adds `Reader(sender)` dynamic field on Dataset + adds dataset to buyer's `Account.read_datasets`

### Read Dataset (Download + Decrypt)
1. Create a Seal `SessionKey` (TTL-limited, uses `SuiJsonRpcClient` for signature verification)
2. Fetch Dataset object to get `blob_ids`, `envelope.version`, and `file_manifest`
3. Build `seal_approve_reader` transaction (dry-run only, `onlyTransactionKind: true`)
4. Decrypt DEK via Seal key servers
5. Fetch encrypted data from Walrus — blobs by blob_id, or quilt patches by quiltPatchId
6. AES-256-GCM decrypt each file with DEK → plaintext

### Archive & Delete Dataset
1. Owner calls `dataset.archive()` — prevents new readers
2. Owner calls `dataset.remove_reader()` for each reader (removes DF + updates reader's Account)
3. Owner calls `dataset.destroy()` — requires `readers_count == 0`, deletes Dataset object
4. Frontend hooks: `useArchiveDataset`, `useArchiveAndDeleteDataset`, `useDeleteBlob`

### Seal Details

- **SDK**: `@mysten/seal`
- **Identity bytes**: 40 bytes = `[dataset_id (32 bytes address)][envelope.version (8 bytes LE u64)]`
- **seal_approve**: Entry function, first param `id: vector<u8>`, must abort on denied access, NO state mutation
- **Session keys**: `SessionKey.create()` with TTL, reusable across decryptions. Uses `SuiJsonRpcClient` (not gRPC) for verification.
- **Encrypt**: `sealClient.encrypt({ threshold, packageId, id, data })` → returns `{ encryptedObject, key }`
- **Decrypt**: `sealClient.decrypt({ data, sessionKey, txBytes })` — txBytes from `seal_approve_reader` call built with `onlyTransactionKind: true`
- **Key rotation**: Increment envelope version, re-encrypt DEK with new Seal identity
- **Key servers**: Configured via `NEXT_PUBLIC_SEAL_KEY_SERVER_OBJECT_IDS` env var (comma-separated). Defaults: Overclock + H2O Nodes (testnet, open).
- **Threshold**: Currently `1` (single key server suffices)

### Walrus Details

- **Store**: HTTP PUT to publisher `/v1/blobs?epochs=N&send_object_to=ADDRESS` → returns blob_id + blobObjectId
- **Quilts**: HTTP PUT multipart to `/v1/quilts?epochs=N&send_object_to=ADDRESS` — bundles multiple files as patches in one quilt blob. Each patch addressable by quiltPatchId.
- **Read blob**: HTTP GET from aggregator `/v1/blobs/{blob_id}`
- **Read quilt patch**: HTTP GET `/v1/blobs/by-quilt-patch-id/{quiltPatchId}` or `/v1/blobs/by-quilt-id/{quiltBlobId}/{identifier}`
- **List quilt patches**: HTTP GET `/v1/quilts/{quiltBlobId}/patches`
- **SDK**: `@mysten/walrus` (dependency) + direct HTTP in `src/lib/walrus.ts`
- **Size limit**: 10 MiB default per blob (configurable), 100 MiB for quilts
- **Epochs**: 1 epoch ~ 1 day on testnet, max 53 epochs (~1 year)

## Testnet Configuration

```
# TuskBazaar (deployed on testnet)
Package ID:          0xb864ad48cfdaefbe4c6cc6a0b1d43969b1bce851b448219d80a62cc754219d96
Platform Object ID:  0xc08b35137bea7470f32819c77042cd4e896a96ab05add5da297912a571752ae1

# Seal
Seal Package (testnet): 0x4016869413374eaa71df2a043d1660ed7bc927ab7962831f8b07efbc7efdb2c3
Key Servers: Overclock (0x9c94..4105), H2O Nodes (0x39ce..25a2)

# Walrus (testnet)
Publisher:  https://publisher.walrus-testnet.walrus.space
Aggregator: https://aggregator.walrus-testnet.walrus.space
```

## Frontend (`app/walrus-wildlife-fund/`)

- **Package manager**: yarn or pnpm (see `pnpm-lock.yaml`)
- **Auth**: Enoki/zkLogin (Google OAuth), burner wallet in dev
- **Sui client**: `SuiGrpcClient` from `@mysten/sui/grpc` (gRPC transport)
- **DApp Kit**: `@mysten/dapp-kit-react` with `createDAppKit()` + `DAppKitProvider`
- **Sponsored txs**: Enoki sponsorship for gasless UX
- **State**: `@nanostores/react` for lightweight client state
- **Config**: `.env` for Enoki keys, Google OAuth, Package ID, Platform Object ID (see `.env.example`)

### Key Libraries (`src/lib/`)

| File | Purpose |
|------|---------|
| `dapp-kit.ts` | DAppKit config: network, gRPC client, Enoki wallet initializer |
| `seal.ts` | Seal client singleton, identity construction, session keys, DEK encrypt/decrypt |
| `crypto.ts` | AES-256-GCM primitives: `generateDEK`, `encryptFile`, `decryptFile` |
| `walrus.ts` | Walrus upload/download: blobs, quilts, quilt patches, multi-upload with concurrency |
| `quilt.ts` | Quilt helper utilities |
| `sui-helpers.ts` | Object parsing, field extraction, `toUiDataset()`, `canRead()`, `deriveObjectID` usage |
| `types.ts` | `Dataset`, `FileManifest`, `ManifestFileEntry`, `DecryptedFile`, `UploadPayload` |
| `mock-data.ts` | Mock data for development |
| `utils.ts` | General utilities |

### Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useUpload` | Full upload pipeline: read files → derive ID → AES encrypt → Walrus upload (blobs or quilt) → Seal DEK → on-chain PTB |
| `useFeed` | Fetch marketplace feed of datasets |
| `useDashboard` | Fetch user's own + purchased datasets |
| `useDataset` | Fetch single dataset details |
| `useArchiveDataset` | Archive a dataset (prevent new readers) |
| `useArchiveAndDeleteDataset` | Full teardown: archive → remove all readers → destroy dataset |
| `useDeleteBlob` | Delete Walrus blob objects on-chain |

### Pages (`src/app/`)

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/marketplace` | Browse all datasets |
| `/upload` | Upload new dataset |
| `/dashboard` | User's datasets (owned + purchased) |
| `/dataset/[id]` | Dataset detail view |
| `/datasets/[id]` | Dataset detail (alternate route) |
| `/search` | Search datasets |
| `/user/[address]` | User profile |

### API Routes (`src/app/api/`)

| Route | Purpose |
|-------|---------|
| `/api/sponsor` | Enoki transaction sponsorship |
| `/api/sponsor/execute` | Execute sponsored transaction |
| `/api/feed` | Server-side dataset feed |
| `/api/stats` | Platform statistics |
| `/api/user/[address]` | User data by address |

```sh
cd app/walrus-wildlife-fund
pnpm install
pnpm dev
```

## Reference: groups-sdk Encryption Pattern

Key files in `~/Projects/Internal/groups-sdk` to reference:
- `ts-sdks/packages/messaging-groups/src/encryption/envelope-encryption.ts` — E2E encryption orchestrator
- `ts-sdks/packages/messaging-groups/src/encryption/dek-manager.ts` — Seal DEK management (generate, cache, decrypt)
- `ts-sdks/packages/messaging-groups/src/encryption/seal-policy.ts` — Building seal_approve transactions
- `move/packages/messaging/sources/seal_policies.move` — Move seal_approve + identity validation

## Documentation

- Walrus: https://docs.wal.app/
- Seal: https://seal-docs.wal.app/
- Seal SDK usage: https://seal-docs.wal.app/UsingSeal/
- Sui Move: https://docs.sui.io/
