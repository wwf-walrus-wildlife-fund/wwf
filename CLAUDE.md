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
| `dataset.move` | Core Dataset object (shared, derived): metadata, readers (dynamic fields), envelope, blob_ids, price, payment |
| `seal_approve_reader.move` | Seal entry function — validates reader access for decryption (dry-run only, no side effects) |

### Move Patterns

- **Account**: Shared object, 1 per address. Derived from `namespace_id + AccountTag(sender)`. Tracks `own_datasets: VecSet<ID>` and `read_datasets: VecSet<ID>`.
- **Namespace counter**: Global incrementing `u64` counter in `TuskBazaarNamespace`, used as derivation key for Dataset IDs
- **Derived objects**: `sui::derived_object` — Account from `namespace_id + AccountTag(address)`, Dataset from `namespace_id + counter`
- **Reader access**: Dynamic fields with `Reader(address)` key on Dataset UID. Creator auto-added as reader.
- **Direct payment**: `dataset.pay_sui_to_read()` — no separate actor/policy object. Validates payment amount, transfers to `funds_receiver`, adds reader DF + updates buyer's Account.
- **Envelope**: `{ encrypted_key: vector<u8>, version: u64 }` — Seal-encrypted DEK with rotation version
- **blob_ids**: `VecSet<String>` (u256 stored as String for explorer readability)
- **Error constants**: `const EDescriptiveName: u64 = N`
- **Visibility**: `public(package)` for internal functions, `entry` for Seal approve

### Build & Test

```sh
cd contracts/tuskbazaar
sui move build
sui move test
```

## Flows

See also `flows.md` at project root for the on-chain flow summaries.

### Create Dataset (Upload)
1. Read current counter from Namespace to derive Dataset object ID (`namespace_id + counter`)
2. Generate random AES-256-GCM key (DEK)
3. Encrypt dataset file(s) with DEK → ciphertext
4. Store encrypted blob(s) on Walrus → get blob_id(s)
5. Encrypt DEK with Seal: `sealClient.encrypt({ threshold, packageId, id: [dataset_id || version_0], data: dek })` → encrypted envelope
6. Call `dataset::new_derived(namespace, account, ...)` on-chain — increments counter, creates Dataset (shared), links to Account, auto-adds creator as reader

### Buy Reader Access — By Paying SUI
1. User calls `dataset.pay_sui_to_read(dataset, payment, account, ctx)`
2. Validates `payment.value() == dataset.price_sui` and `sender == account.owner`
3. Transfers payment to `dataset.funds_receiver`
4. Adds `Reader(sender)` dynamic field on Dataset + adds dataset to buyer's `Account.read_datasets`

### Read Dataset (Download + Decrypt)
1. Create a Seal `SessionKey` (TTL-limited, sign personal message with user's keypair)
2. Fetch Dataset object to get `blob_ids` and `envelope.version`
3. Build `seal_approve_reader` transaction:
   ```ts
   const tx = new Transaction();
   tx.moveCall({
     target: `${packageId}::seal_approve_reader::seal_approve_reader`,
     arguments: [
       tx.pure.vector('u8', identityBytes),  // [dataset_id (32) || version (8 LE)]
       tx.object(datasetId),
     ],
   });
   const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
   ```
4. Decrypt DEK: `sealClient.decrypt({ data: envelope.encrypted_key, sessionKey, txBytes })`
   - Seal key servers dry-run the tx to verify reader access
   - If `seal_approve_reader` doesn't abort → servers return identity-based private keys
   - Client reconstructs DEK from threshold shares
5. Fetch encrypted blob(s) from Walrus aggregator by blob_id
6. AES-256-GCM decrypt blob(s) with DEK → plaintext dataset

### Seal Details

- **SDK**: `@mysten/seal`
- **Identity bytes**: 40 bytes = `[dataset_id (32 bytes address)][envelope.version (8 bytes LE u64)]`
- **seal_approve**: Entry function, first param `id: vector<u8>`, must abort on denied access, NO state mutation
- **Session keys**: `SessionKey.create()` with TTL, reusable across decryptions
- **Encrypt**: `sealClient.encrypt({ threshold, packageId, id, data })` → returns `{ encryptedObject, key }`
- **Decrypt**: `sealClient.decrypt({ data, sessionKey, txBytes })` — txBytes from `seal_approve_reader` call built with `onlyTransactionKind: true`
- **Key rotation**: Increment envelope version, re-encrypt DEK with new Seal identity

### Walrus Details

- **Store**: HTTP PUT to publisher endpoint → returns blob_id
- **Read**: HTTP GET from aggregator endpoint `/v1/blobs/{blob_id}`
- **SDK**: `@mysten/walrus` or direct HTTP
- **Size limit**: 10 MiB default per blob (configurable), 100 MiB for quilts

## Testnet Configuration

```
# Seal
Seal Package (testnet): 0x4016869413374eaa71df2a043d1660ed7bc927ab7962831f8b07efbc7efdb2c3

# Walrus (testnet)
Publisher:  https://publisher.walrus-testnet.walrus.space
Aggregator: https://aggregator.walrus-testnet.walrus.space

# TuskBazaar (not yet deployed)
# Package ID: TBD (deploy with `sui client publish`)
```

## Frontend (`app/walrus-wildlife-fund/`)

- **Auth**: Enoki/zkLogin (Google OAuth), burner wallet in dev
- **Sui**: `@mysten/sui`, `@mysten/dapp-kit-react`
- **Sponsored txs**: Enoki sponsorship for gasless UX
- **Hooks**: `src/hooks/` — `useUpload`, `useBuy`, `useDecrypt`, `useFeed`, etc.
- **Config**: `.env` for Enoki keys + Google OAuth (see `.env.example`)

```sh
cd app/walrus-wildlife-fund
npm install
npm run dev
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
